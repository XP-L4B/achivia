// Pillole riutilizzabili (XP, crediti, livello).
// Modifica lo stile in .xp-circle / .credits-pill (index.css) e il markup qui:
// così un cambiamento si riflette ovunque, senza toccare le singole pagine.

export function XpPill({ value, className = '', style, title }) {
  return (
    <span className={`xp-circle ${className}`.trim()} style={style} title={title ?? `${value} punti esperienza`}>
      {value} XP
    </span>
  );
}

export function CreditsPill({ value, className = '', style, title }) {
  return (
    <span className={`credits-pill ${className}`.trim()} style={style} title={title ?? `${value} crediti`}>
      {value}
    </span>
  );
}

export function LevelPill({ level, className = '', style, title }) {
  return (
    <span className={`level-pill ${className}`.trim()} style={style} title={title ?? `Livello ${level}`}>
      Lv {level}
    </span>
  );
}
