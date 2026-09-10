/**
 * Il calendario della stanza: cinquantadue settimane fanno un anno, e si
 * parte a settembre — a diciannove anni, quando comincia tutto. Il mese
 * sta scritto sotto la finestra, la stagione cambia il cielo.
 */
const STAGIONI = ['inverno', 'inverno', 'primavera', 'primavera', 'primavera', 'estate', 'estate', 'estate', 'autunno', 'autunno', 'autunno', 'inverno'];
const MESI = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];

export function calendarioDi(settimana) {
  const dentro = (settimana - 1) % 52;
  const mese = (8 + Math.floor((dentro / 52) * 12)) % 12;
  const anno = Math.floor((settimana - 1) / 52) + 1;
  return { mese: MESI[mese], stagione: STAGIONI[mese], anno };
}

