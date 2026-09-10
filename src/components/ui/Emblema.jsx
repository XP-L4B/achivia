import { emblemaDi, formaDi, sfondoDi, accentoDi, simboloDi, inizialiDi } from '../../data/emblema';

/**
 * L'insegna di un'organizzazione: il logo caricato o lo stemma disegnato.
 *
 * Lo stemma e' un vettoriale, non un'immagine: la stessa insegna esce
 * nitida a ventiquattro pixel nella barra in alto e a centoventi nel
 * profilo, e pesa quattro parole invece di duecento kilobyte.
 *
 * Con `stemma` disegna quello che gli si passa — serve all'anteprima
 * mentre lo si compone; senza, va a vedere che insegna ha l'organizzazione.
 */

const CONTORNI = {
  scudo: 'M32 4 58 12v22c0 13-11 22-26 26C17 56 6 47 6 34V12z',
  cerchio: 'M32 4a28 28 0 1 1 0 56 28 28 0 0 1 0-56z',
  esagono: 'M32 3 57 17v30L32 61 7 47V17z',
  rombo: 'M32 2 62 32 32 62 2 32z',
};

export function StemmaDisegnato({ stemma, nomeOrg, size = 48, titolo }) {
  const forma = formaDi(stemma).id;
  const fondo = sfondoDi(stemma);
  const accento = accentoDi(stemma);
  const simbolo = simboloDi(stemma);

  return (
    <svg
      className="emblema"
      viewBox="0 0 64 64"
      width={size}
      height={size}
      role={titolo ? 'img' : undefined}
      aria-label={titolo || undefined}
      aria-hidden={titolo ? undefined : true}
    >
      <path d={CONTORNI[forma] || CONTORNI.scudo} fill={fondo} stroke={accento} strokeWidth="3" strokeLinejoin="round" />
      {simbolo.path ? (
        <path d={simbolo.path} fill={accento} />
      ) : (
        <text
          x="32"
          y="41"
          textAnchor="middle"
          fill={accento}
          style={{ font: "700 24px 'Micro 5', 'Press Start 2P', monospace", letterSpacing: '1px' }}
        >
          {inizialiDi(nomeOrg)}
        </text>
      )}
    </svg>
  );
}

export default function Emblema({ orgId, nomeOrg, stemma, size = 48, titolo }) {
  // L'anteprima passa lo stemma in lavorazione; tutto il resto dell'app
  // chiede solo "che insegna ha questa organizzazione".
  const insegna = stemma ? { tipo: 'stemma', stemma } : emblemaDi(orgId);
  if (!insegna) return null;

  if (insegna.tipo === 'logo') {
    return (
      <img
        className="emblema is-logo"
        src={insegna.dati}
        alt={titolo || ''}
        aria-hidden={titolo ? undefined : true}
        style={{ width: size, height: size }}
      />
    );
  }
  return <StemmaDisegnato stemma={insegna.stemma} nomeOrg={nomeOrg} size={size} titolo={titolo} />;
}
