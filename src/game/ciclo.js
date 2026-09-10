/**
 * Il ciclo: passo fisso ad accumulatore, disegno a ogni fotogramma.
 *
 * La simulazione avanza sempre di un sessantesimo: su un telefono lento e
 * su un portatile veloce le regole sono le stesse, e una partita nata da un
 * seme si rigioca uguale. Il disegno invece va alla velocita' che il
 * dispositivo permette.
 *
 * Dopo una pausa lunga — una scheda tornata in primo piano — non si
 * recuperano trenta secondi in un fotogramma: si simula al massimo qualche
 * passo e si riprende da li'.
 *
 * In pausa si disegna un fotogramma solo, poi si aspetta: niente si muove,
 * e ridisegnare sessanta volte al secondo la stessa immagine costa batteria
 * per niente.
 */
export function creaCiclo({ passo = 1 / 60, maxPassi = 5, avanza, disegna }) {
  let attivo = false;
  let inPausa = false;
  let daDisegnareInPausa = false;
  let richiesta = 0;
  let ultimo = 0;
  let accumulo = 0;
  let orologio = 0;   // tempo reale trascorso a ciclo attivo, per le animazioni

  function fotogramma(adesso) {
    if (!attivo) return;
    richiesta = requestAnimationFrame(fotogramma);
    const dt = Math.min(0.25, (adesso - ultimo) / 1000);
    ultimo = adesso;
    if (inPausa) {
      if (daDisegnareInPausa) { daDisegnareInPausa = false; disegna(orologio); }
      return;
    }
    orologio += dt;
    accumulo += dt;
    let passi = 0;
    while (accumulo >= passo && passi < maxPassi) {
      avanza(passo);
      accumulo -= passo;
      passi += 1;
    }
    if (passi === maxPassi) accumulo = 0;
    disegna(orologio);
  }

  return {
    avvia() {
      if (attivo) return;
      attivo = true;
      ultimo = performance.now();
      accumulo = 0;
      richiesta = requestAnimationFrame(fotogramma);
    },
    ferma() {
      attivo = false;
      if (richiesta) cancelAnimationFrame(richiesta);
      richiesta = 0;
    },
    pausa(v) {
      const nuova = Boolean(v);
      if (nuova === inPausa) return;
      inPausa = nuova;
      if (inPausa) daDisegnareInPausa = true;
      else { ultimo = performance.now(); accumulo = 0; }
    },
    get inPausa() { return inPausa; },
    get attivo() { return attivo; },
  };
}
