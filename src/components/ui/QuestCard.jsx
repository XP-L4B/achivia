import { useEffect, useState } from 'react';
import { xpDiQuest, quoteDi, quotaDi } from '../../data/db';

/** Tempo che manca alla scadenza, nel formato hh:mm:ss dei mockup. */
function countdown(deadline, adesso) {
  if (!deadline) return null;
  const ms = new Date(deadline).getTime() - adesso;
  if (Number.isNaN(ms)) return null;
  if (ms <= 0) return { text: 'SCADUTA', tone: 'late' };
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const pad = (n) => String(n).padStart(2, '0');
  // Sotto le 48 ore la scadenza è vicina: nei mockup il timer vira al rosso.
  return { text: `${pad(h)}:${pad(m)}:${pad(s)}`, tone: h < 48 ? 'soon' : 'ok' };
}

/**
 * Riquadro di una quest: titolo, chi l'ha assegnata, ricompensa e timer.
 * `onOpen` mostra la freccia di espansione in alto a destra.
 *
 * Una quest di gruppo la ricompensa la divide: la riga lo dice, perche' chi
 * legge "◉ 100" su una quest di progetto e poi ne incassa venticinque ha
 * ragione a sentirsi preso in giro. Con `perId` la parte scritta e' quella
 * di quella persona, altrimenti quella base.
 *
 * `conclusa` e' l'attimo subito dopo che la quest e' stata segnata come
 * fatta: al posto dei pulsanti compare il segno di spunta che si disegna,
 * con accanto la ricompensa messa in gioco, e il riquadro si accende per un
 * momento. Dura meno di un secondo e poi la quest se ne va fra le concluse:
 * serve a far vedere che il gesto e' arrivato, non a festeggiare.
 */
export default function QuestCard({ quest, assignedBy, onOpen, conclusa = false, perId, children }) {
  // Il timer scorre: un secondo alla volta, e solo se la quest ha una scadenza.
  const [adesso, setAdesso] = useState(() => Date.now());
  useEffect(() => {
    if (!quest.deadline) return undefined;
    const id = setInterval(() => setAdesso(Date.now()), 1000);
    return () => clearInterval(id);
  }, [quest.deadline]);

  const t = countdown(quest.deadline, adesso);

  // Chi incassa questa quest, e quanto. Con una persona sola non c'e' niente
  // da dire: e' la ricompensa scritta accanto.
  const quote = quoteDi(quest);
  const divisa = quote.length > 1;
  const miaParte = perId
    ? quotaDi(quest, perId)
    : Math.min(...quote.map((q) => q.crediti), quest.credits ?? 0);

  return (
    <article className={`ui-quest${conclusa ? ' is-conclusa' : ''}`}>
      <div className="ui-quest-head">
        <h4 className="ui-quest-title">{quest.title}</h4>
        {onOpen && (
          <button type="button" className="ui-expand" onClick={onOpen} aria-label={`Apri ${quest.title}`}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 4h6v6M20 4l-7 7M10 20H4v-6M4 20l7-7" />
            </svg>
          </button>
        )}
      </div>

      {assignedBy && <p className="ui-quest-by">Assegnata da: {assignedBy}</p>}
      {quest.description && <p className="ui-quest-desc">{quest.description}</p>}

      <div className="ui-quest-foot">
        <span className="ui-reward">
          {/* Esperienza e crediti sono lo stesso numero: un lavoro vale
              quello che vale, e l'esperienza lo segue. */}
          RICOMPENSA: <span className="ui-exp">EXP {xpDiQuest(quest)}</span>{' '}
          <span className="ui-gold">◉ {quest.credits ?? 0}</span>
          {divisa && (
            <span className="ui-quest-quota">
              {' '}· divisa fra {quote.length}: <span className="ui-gold">◉ {miaParte}</span> a testa
            </span>
          )}
        </span>
        {t && <span className={`ui-timer ${t.tone}`}>{t.text}</span>}
      </div>

      {conclusa ? (
        <p className="mo-esito" role="status">
          <svg className="mo-check" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
            <path d="M4 12.5 9.5 18 20 6.5" />
          </svg>
          <span className="mo-esito-testo">COMPLETATA</span>
          {/* La ricompensa non e' ancora sul conto: la accredita il manager
              quando approva. Si dice quanto vale, e che manca quel passo. */}
          <span className="mo-esito-premio">
            <b>+{divisa ? miaParte : xpDiQuest(quest)} EXP</b> · <i>◉ {divisa ? miaParte : (quest.credits ?? 0)}</i> all&apos;approvazione
          </span>
        </p>
      ) : (
        children && <div className="ui-quest-actions">{children}</div>
      )}
    </article>
  );
}

