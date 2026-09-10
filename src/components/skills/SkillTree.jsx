import SkillBadge from './SkillBadge';

/**
 * La mappa delle competenze di una persona.
 *
 * Non e' un albero disegnato con i rami: su un telefono un grafo con archi
 * diventa illeggibile appena le competenze superano la dozzina. E' invece
 * una mappa a rami tematici — una colonna per categoria — dove ogni nodo
 * dichiara da dove ci si arriva. La progressione si legge nell'ordine dei
 * nodi e nella riga "di solito dopo…", che e' l'informazione che l'albero
 * avrebbe dato con una freccia.
 *
 * Le competenze certificate stanno in cima al loro ramo: quello che si e'
 * conquistato si vede per primo. Nessun nodo e' sbarrato — la riga "di
 * solito dopo" indica il cammino consigliato, non un lucchetto.
 */
export default function SkillTree({ categorie, onApri, vuoto }) {
  const nessuna = categorie.every((c) => c.nodi.length === 0);
  if (nessuna) return vuoto ?? null;

  return (
    <div className="skill-tree">
      {categorie.map((cat) => {
        const certificate = cat.nodi.filter((n) => n.stato === 'certified').length;
        // Prima quello che si e' conquistato, poi il resto in ordine.
        const ordinati = [...cat.nodi].sort((a, b) => {
          if (a.stato !== b.stato) return a.stato === 'certified' ? -1 : 1;
          return a.skill.name.localeCompare(b.skill.name);
        });

        return (
          <section key={cat.id} className="skill-branch" style={{ '--ramo': cat.colore }}>
            <header className="skill-branch-head">
              <h3>{cat.label}</h3>
              <span className="skill-branch-count">{certificate}/{cat.nodi.length}</span>
            </header>
            <div
              className="skill-branch-bar"
              role="img"
              aria-label={`${certificate} competenze certificate su ${cat.nodi.length}`}
            >
              <span style={{ width: `${(certificate / cat.nodi.length) * 100}%` }} />
            </div>

            <ul className="skill-nodes">
              {ordinati.map((n) => (
                <li key={n.skill.id} className={`skill-node is-${n.stato}`}>
                  <SkillBadge
                    skill={n.skill}
                    stato={n.stato}
                    livello={n.livello}
                    size={64}
                    onClick={() => onApri?.(n)}
                    title={`${n.skill.name} — ${n.stato === 'certified' ? 'certificata' : 'da sviluppare'}`}
                  />
                  <button type="button" className="skill-node-name" onClick={() => onApri?.(n)}>
                    {n.skill.name}
                  </button>
                  {n.stato === 'certified' && n.livello && (
                    <span className="skill-node-level">{n.livello.label}</span>
                  )}
                  {n.stato !== 'certified' && n.vienePrima?.length > 0 && (
                    <span className="skill-node-hint">
                      di solito dopo {n.vienePrima.map((s) => s.name).join(', ')}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
