import { useState } from 'react';
import SkillTree from './SkillTree';
import SkillBadge from './SkillBadge';
import SkillDetailDialog from './SkillDetailDialog';
import { skillTreeOf, riepilogoSkill, consigliDi } from '../../data/skills';
import TerminalPanel from '../terminal/TerminalPanel';
import TerminalRows, { TerminalValue } from '../terminal/TerminalRows';
import TerminalBar from '../terminal/TerminalBar';

/**
 * Lo Skill Tree di una persona: il riepilogo, la mappa e le competenze che
 * qualcuno le ha consigliato. Lo usa il dipendente su di se' e chi certifica
 * quando apre la scheda di qualcun altro.
 *
 * `azioniPerNodo` permette a chi ha i permessi di agire su una competenza
 * (certificarla, revocarla, consigliarla) senza che questo componente sappia
 * nulla di permessi: li decide la pagina che lo usa.
 */
export default function MySkillTree({ persona, proprio = false, azioniPerNodo }) {
  const [aperto, setAperto] = useState(null);

  const { categorie } = skillTreeOf(persona);
  const riepilogo = riepilogoSkill(persona);
  const consigli = consigliDi(persona);

  const vuoto = (
    <div className="empty-state ui-blocco">
      {proprio ? (
        <>
          <b>Il tuo Skill Tree sta appena iniziando.</b>
          <p style={{ margin: 'var(--space-2) 0 0' }}>
            Completa la tua prima quest o ricevi la prima certificazione per cominciare
            a costruire il tuo profilo professionale.
          </p>
        </>
      ) : (
        <>Nessuna competenza nella mappa di questa persona.</>
      )}
    </div>
  );

  return (
    <>
      {/* Il riepilogo dice a colpo d'occhio a che punto e' il percorso */}
      <div className="ui-blocco con-stacco">
        <TerminalPanel
          titolo={proprio ? 'LE MIE COMPETENZE' : `COMPETENZE · ${persona.name}`}
          meta={`${riepilogo.certificate}/${riepilogo.totale}`}
          piede={`LIVELLI_ACCUMULATI: ${riepilogo.livelli}`}
        >
          <TerminalValue
            valore={`${riepilogo.percentuale}%`}
            unita="certificate"
            nota={`${riepilogo.certificate} su ${riepilogo.totale}`}
          />
          <TerminalBar
            percentuale={riepilogo.percentuale}
            etichetta={`${riepilogo.percentuale}% delle competenze certificate`}
          />
          <div className="tv-riga" aria-hidden="true" />
          <TerminalRows
            vivo
            voci={[
              ['Soft skill', riepilogo.soft],
              ['Tecniche', riepilogo.tecniche],
              { label: 'Da sviluppare', valore: riepilogo.daSviluppare, tono: riepilogo.daSviluppare > 0 ? 'attesa' : 'spento' },
            ]}
          />
        </TerminalPanel>
      </div>

      {consigli.length > 0 && (
        <section style={{ padding: '0 14px', marginBottom: 'var(--space-4)' }}>
          <h2 style={{ margin: '0 0 var(--space-3)' }}>Consigliate</h2>
          <div className="skill-reco">
            {consigli.map((r) => (
              <button
                key={r.id}
                type="button"
                className="skill-reco-item"
                onClick={() => setAperto({
                  skill: r.skill,
                  stato: 'available',
                  certificazione: null,
                  livello: null,
                  vienePrima: [],
                })}
              >
                <SkillBadge skill={r.skill} stato="available" size={44} />
                <span>
                  <b>{r.skill.name}</b>
                  <small>consigliata da {r.da?.name || 'il manager'}</small>
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      <SkillTree categorie={categorie} onApri={setAperto} vuoto={vuoto} />

      <SkillDetailDialog
        nodo={aperto}
        onChiudi={() => setAperto(null)}
        azioni={aperto && azioniPerNodo ? azioniPerNodo(aperto, () => setAperto(null)) : null}
      />
    </>
  );
}
