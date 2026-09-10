import { useState } from 'react';
import AchievementBadge from './AchievementBadge';
import AchievementDetailDialog from './AchievementDetailDialog';
import TerminalPanel from '../terminal/TerminalPanel';
import { progressiTraguardi, riepilogoTraguardi } from '../../data/traguardiOrg';
import { GRUPPI_ORG } from '../../data/achievementsOrg';
import useScrivania from '../../hooks/useScrivania';

/**
 * Le medaglie dell'organizzazione nel profilo di chi la guida.
 *
 * Non sono i suoi traguardi: sono quelli dell'azienda, e li porta chi ne
 * risponde. Stanno raggruppate come nel catalogo — quest, competenze,
 * collaborazione, persone, presenze, economia — perche' trenta medaglie in
 * fila sarebbero un muro, e sei gruppi da quattro o cinque si leggono.
 *
 * Una medaglia a livelli mostra il metallo raggiunto e il nome del gradino;
 * una ripetibile mostra quante volte e' stata presa. Cliccandone una si apre
 * la scheda: a che punto siamo e tutte le volte in cui e' successo.
 */
export default function TraguardiOrganizzazione({ persona, pieghevole = false }) {
  const [aperto, setAperto] = useState(null);
  // Trenta medaglie sono la parte piu' lunga del profilo: li' sul telefono
  // la bacheca parte chiusa e si apre quando la si vuole guardare. Nella
  // pagina Achievements no: e' tutto quello che quella vista ha da dire, e
  // aprirla per trovarla chiusa sarebbe una porta su un'altra porta.
  const scrivania = useScrivania();
  const piega = pieghevole && !scrivania;

  const progressi = progressiTraguardi(persona);
  const riepilogo = riepilogoTraguardi(persona);

  return (
    <>
      <TerminalPanel
        pieghevole={piega}
        apertoDiDefault={false}
        titolo="TRAGUARDI DELL’ORGANIZZAZIONE"
        meta={`${riepilogo.presi} / ${riepilogo.totale}`}
        piede={`MEDAGLIE_IN_BACHECA: ${riepilogo.medaglie}${riepilogo.diamanti ? ` · DIAMANTI: ${riepilogo.diamanti}` : ''}`}
        className="ach-section ui-blocco con-stacco"
        style={{ width: '100%' }}
      >
        {GRUPPI_ORG.map((gruppo) => {
          const delGruppo = progressi.filter((p) => p.definizione.gruppo === gruppo);
          if (delGruppo.length === 0) return null;
          return (
            <div key={gruppo}>
              <h3 className="tv-sottotitolo">{gruppo}</h3>
              <div className="ach-vetrina">
                {delGruppo.map((p) => (
                  <button
                    key={p.definizione.id}
                    type="button"
                    className={`ach-vetrina-voce${p.volte === 0 ? ' is-spenta' : ''}`}
                    onClick={() => setAperto(p)}
                    title={p.volte > 0
                      ? `${p.definizione.nome}${p.nomeLivello ? ` · ${p.nomeLivello}` : ` × ${p.volte}`}`
                      : `${p.definizione.nome} · ${p.percentuale}%`}
                  >
                    <AchievementBadge
                      definizione={p.definizione}
                      ottenuto={p.volte > 0}
                      volte={p.livello ? 0 : p.volte}
                      size={52}
                    />
                    <span>{p.definizione.nome}</span>
                    {/* Sotto il nome, la cosa che quella medaglia dice di
                        se': il gradino, le volte, o quanto manca. */}
                    <small className="ach-vetrina-nota">
                      {p.nomeLivello || (p.volte > 0 ? `×${p.volte}` : `${p.percentuale}%`)}
                    </small>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </TerminalPanel>

      {aperto && <AchievementDetailDialog progresso={aperto} onChiudi={() => setAperto(null)} />}
    </>
  );
}
