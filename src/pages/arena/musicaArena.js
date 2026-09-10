import { useEffect } from 'react';
import { consentiPartenzaDaSola } from '../../data/musica';

/**
 * Dentro l'arena la musica non parte da sola.
 *
 * Fuori di qui e' giusto che parta al primo tocco: si e' aperta
 * un'applicazione che ha una sua musica. Entrando in un gioco no — quel
 * tocco e' "Entra", e chi lo preme non sta chiedendo la musica — e chi
 * l'ha spenta la ritrova spenta.
 *
 * Quello che gia' suona continua a suonare: entrare in una partita non
 * zittisce niente, la abbassa soltanto (`PartitaPage`). Per accenderla
 * restano le opzioni dell'atrio, che e' un'altra cosa: e' qualcuno che la
 * chiede.
 */
export function useMusicaFermaNellArena() {
  useEffect(() => {
    consentiPartenzaDaSola(false);
    return () => consentiPartenzaDaSola(true);
  }, []);
}
