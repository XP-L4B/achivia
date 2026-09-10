import { useState } from 'react';
import { useParams } from 'react-router-dom';
import PageShell from '../../components/ui/PageShell';
import Tile from '../../components/ui/Tile';
import { getUserById, getReviewsForUser } from '../../data/db';
import makeNewIcon from '../../assets/ui/makeNew.png';
import perfIcon from '../../assets/ui/perfReview.png';
import BackTile from '../../components/ui/BackTile';

const data = (iso) => new Date(iso).toLocaleDateString('it-IT');

/**
 * Storico delle performance review di una persona: una scheda per review, con
 * data, autore, sintesi e punteggio medio. Apribile per vedere i singoli voti.
 * In fondo l'andamento dei punteggi nel tempo.
 */
export default function ReviewHistoryPage() {
  const { id } = useParams();
  const [aperta, setAperta] = useState(null);

  const u = getUserById(id);
  if (!u) return <PageShell title="Storico review" description="Persona non trovata." />;

  const reviews = getReviewsForUser(u.id);

  return (
    <>
      <PageShell
        title="Storico review"
        description={`Le valutazioni di ${u.name}, dalla più recente.`}
      />

      {reviews.length === 0 ? (
        <div className="empty-state ui-blocco con-stacco">
          Non c'è ancora nessuna valutazione.
        </div>
      ) : (
        <>
          {reviews.map((r) => (
            <article key={r.id} className="ui-quest">
              <div className="ui-quest-head">
                <div style={{ flex: 1 }}>
                  <h4 className="ui-quest-title">{data(r.date)}</h4>
                  <p className="ui-quest-by">
                    Fatta da: {getUserById(r.authorId)?.name ?? '—'}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p className="ui-reward">MEDIA</p>
                  <p className="ui-userhead-lvl" style={{ fontSize: '1.1rem' }}>{r.average}</p>
                </div>
              </div>

              {r.summary && <p className="ui-quest-desc">{r.summary}</p>}

              <button
                type="button"
                className="px-btn ghost"
                style={{ width: 'auto', marginTop: 12 }}
                onClick={() => setAperta(aperta === r.id ? null : r.id)}
              >
                {aperta === r.id ? 'Chiudi dettaglio' : 'Vedi i voti'}
              </button>

              {aperta === r.id && (
                <ul style={{ listStyle: 'none', marginTop: 14, display: 'grid', gap: 10 }}>
                  {r.criteria.map((c, i) => (
                    <li key={i} className="ui-stat" style={{ textAlign: 'left' }}>
                      {c.label}: {c.score || '—'}/5
                      {c.note && <><br />{c.note}</>}
                    </li>
                  ))}
                </ul>
              )}
            </article>
          ))}

          <ReviewChart reviews={[...reviews].reverse()} />
        </>
      )}

      <div className="ui-tiles pairs" style={{ paddingBottom: 24 }}>
        <Tile to={`/manager/management/employees/${u.id}/review`} icon={makeNewIcon} label="Nuova review" />
        <Tile to={`/manager/management/employees/${u.id}`} icon={perfIcon} label="Torna alla scheda" />
      </div>
      <BackTile />
    </>
  );
}

/** Andamento dei punteggi medi nel tempo, disegnato senza librerie esterne. */
function ReviewChart({ reviews }) {
  if (reviews.length < 2) return null;

  const W = 300;
  const H = 120;
  const PAD = 16;
  const punti = reviews.map((r, i) => {
    const x = PAD + (i * (W - PAD * 2)) / (reviews.length - 1);
    const y = H - PAD - ((r.average / 5) * (H - PAD * 2));
    return { x, y, r };
  });
  const linea = punti.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

  return (
    <section className="ui-panel ui-blocco con-stacco">
      <p className="ui-ai-title">Andamento</p>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img"
           aria-label={`Punteggi medi: ${reviews.map((r) => r.average).join(', ')}`}>
        {[1, 2, 3, 4, 5].map((v) => {
          const y = H - PAD - ((v / 5) * (H - PAD * 2));
          return <line key={v} x1={PAD} y1={y} x2={W - PAD} y2={y} stroke="#ffffff22" strokeWidth="1" />;
        })}
        <polyline points={linea} fill="none" stroke="#00bf63" strokeWidth="2.5" />
        {punti.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="4" fill="#00bf63" />
        ))}
      </svg>
      <p style={{ marginTop: 8 }}>
        Dalla più vecchia alla più recente: {reviews.map((r) => r.average).join(' · ')}
      </p>
    </section>
  );
}
