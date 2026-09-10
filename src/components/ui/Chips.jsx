/**
 * Riga di pillole per filtri e schede, come in "Active quests" (per scadenza /
 * per data / per manager), "Members list" (cerca / per team / per ruolo) e nel
 * selettore di periodo delle analytics.
 *
 * `items`: [{ id, label }]. `value` è l'id selezionato.
 *
 * Con `multipla` se ne possono accendere più di una: `value` diventa un
 * elenco e `onChange` ne riceve uno nuovo. Cambia anche il ruolo ARIA, e non
 * è un dettaglio — una fila di schede si esplora con le frecce e ne resta
 * scelta una sola, un gruppo di interruttori no. Dire "scheda" a chi non
 * vede quando invece si possono premere tutti sarebbe una bugia detta a chi
 * ha meno modi di accorgersene.
 */
export default function Chips({ items, value, onChange, ariaLabel, multipla = false }) {
  const scelte = multipla ? (value || []) : [];
  const acceso = (id) => (multipla ? scelte.includes(id) : value === id);

  const premi = (id) => {
    if (!multipla) return onChange(id);
    return onChange(scelte.includes(id) ? scelte.filter((x) => x !== id) : [...scelte, id]);
  };

  return (
    <div className="ui-chips" role={multipla ? 'group' : 'tablist'} aria-label={ariaLabel}>
      {items.map((it) => (
        <button
          key={it.id}
          type="button"
          role={multipla ? undefined : 'tab'}
          aria-selected={multipla ? undefined : value === it.id}
          aria-pressed={multipla ? acceso(it.id) : undefined}
          className={`ui-chip${acceso(it.id) ? ' active' : ''}`}
          onClick={() => premi(it.id)}
        >
          {it.label}
        </button>
      ))}
    </div>
  );
}
