import { useEffect, useState } from 'react';

/**
 * Se si sta guardando da uno schermo da scrivania.
 *
 * E' la stessa soglia della versione desktop del foglio di stile — mille
 * ventiquattro pixel — perche' due soglie diverse vorrebbero dire che il
 * disegno cambia in un punto e il comportamento in un altro.
 *
 * Serve dove la differenza non e' di stile ma di sostanza: sul telefono un
 * pannello lungo si chiude per non far scorrere mezza pagina, di fianco a
 * una colonna larga sta aperto perche' lo spazio c'e'.
 */
const DA_SCRIVANIA = '(min-width: 1024px)';

export default function useScrivania() {
  const guarda = () => (typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia(DA_SCRIVANIA).matches
    : false);
  const [scrivania, setScrivania] = useState(guarda);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return undefined;
    const media = window.matchMedia(DA_SCRIVANIA);
    const cambia = (e) => setScrivania(e.matches);
    media.addEventListener('change', cambia);
    return () => media.removeEventListener('change', cambia);
  }, []);

  return scrivania;
}
