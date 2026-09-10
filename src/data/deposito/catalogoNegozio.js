/**
 * Il catalogo del negozio: quello con cui l'app arriva.
 *
 * IL NEGOZIO E' UNO SOLO PER TUTTI. Non appartiene a nessuna
 * organizzazione — un articolo non porta un `orgId` addosso — e chi compra
 * vede la stessa vetrina da qualunque organizzazione stia guardando. A
 * tenerlo e' l'account `shop`, e solo lui: la sua dashboard aggiunge,
 * modifica, mette in offerta e toglie, e quello che fa vale per tutti
 * subito.
 *
 * Questo file e' quello con cui il catalogo *nasce*, non quello che
 * comanda: da qui in avanti la verita' e' il deposito, e chi tiene il
 * negozio puo' cambiare qualunque riga senza tornare qui. Serve in due
 * momenti soli — quando il deposito nasce da zero (`freshFromSeed`) e
 * quando arriva a chi aveva gia' dei dati salvati (`avvia`, una volta) —
 * e per questo porta un nome di versione: `CATALOGO_CONSEGNATO`. Cambiarlo
 * fa arrivare a tutti gli articoli nuovi che mancano, senza toccare quelli
 * che il negozio ha aggiunto o modificato per conto suo.
 *
 * Le immagini stanno in `src/assets/negozio/`, una per articolo, con lo
 * stesso nome che si legge in `immagine`.
 */

/** Il nome di questa consegna. Cambiandolo, il catalogo nuovo raggiunge chi ha gia' dei dati. */
export const CATALOGO_CONSEGNATO = 'xpcorner-2026-09';

/** Gli articoli segnaposto con cui l'app e' nata: se ci sono ancora, se ne vanno. */
export const ARTICOLI_SUPERATI = ['art-mug', 'art-tshirt', 'art-sword'];

export const CATEGORIE_NEGOZIO = [
  { id: 'cat-tecnologia', nome: 'Tecnologia' },
  { id: 'cat-scrivania', nome: 'Scrivania' },
  { id: 'cat-borse', nome: 'Borse e zaini' },
  { id: 'cat-abbigliamento', nome: 'Abbigliamento' },
];

export const ARTICOLI_NEGOZIO = [
  { id: 'art-tshirt-bianca', nome: 'T-shirt bianca', descrizione: 'Cotone ring spun, single jersey 160 g/m². Etichetta staccabile. Dalla S alla 3XL.', crediti: 250, sconto: 0, offertaFino: null, scorta: null, immagine: 'tshirt-bianca', pixelata: false, categoriaId: 'cat-abbigliamento', attivo: true },
  { id: 'art-tshirt-colorata', nome: 'T-shirt colorata', descrizione: 'Cotone ring spun, single jersey 160 g/m². Etichetta staccabile. Dalla S alla 3XL.', crediti: 280, sconto: 0, offertaFino: null, scorta: null, immagine: 'tshirt-colorata', pixelata: false, categoriaId: 'cat-abbigliamento', attivo: true },
  { id: 'art-cavo-caricatore-bambu', nome: 'Cavo di ricarica in bambù', descrizione: 'Bambù e poliestere riciclato RPET. Micro USB, Type C e Lightning, ricarica rapida 60W. Trasferisce anche i dati. 105 cm.', crediti: 350, sconto: 0, offertaFino: null, scorta: null, immagine: 'cavo-caricatore-bambu', pixelata: false, categoriaId: 'cat-tecnologia', attivo: true },
  { id: 'art-cassa-bluetooth', nome: 'Cassa Bluetooth da tavolo', descrizione: 'Piccola, con ventosa: si attacca dove vuoi e regge il telefono. 3W, batteria 200 mAh. Vivavoce.', crediti: 400, sconto: 0, offertaFino: null, scorta: null, immagine: 'cassa-bluetooth', pixelata: false, categoriaId: 'cat-tecnologia', attivo: true },
  { id: 'art-tappetino-mouse-led', nome: 'Tappetino mouse con luci LED', descrizione: 'Superficie antiscivolo 35 × 25 cm, bordo a LED multicolore. Si collega via USB.', crediti: 450, sconto: 0, offertaFino: null, scorta: null, immagine: 'tappetino-mouse-led', pixelata: false, categoriaId: 'cat-tecnologia', attivo: true },
  { id: 'art-scaldatazza-bambu', nome: 'Scaldatazza in bambù', descrizione: 'Tiene il caffè alla temperatura giusta per tutta la riunione. Collegamento USB e Type C.', crediti: 550, sconto: 0, offertaFino: null, scorta: null, immagine: 'scaldatazza-bambu', pixelata: false, categoriaId: 'cat-tecnologia', attivo: true },
  { id: 'art-lampada-caricatore', nome: 'Lampada da scrivania con ricarica wireless', descrizione: 'Bambù, dodici LED, braccio flessibile e intensità regolabile. Ricarica il telefono appoggiandolo alla base, 15W.', crediti: 700, sconto: 0, offertaFino: null, scorta: null, immagine: 'lampada-caricatore', pixelata: false, categoriaId: 'cat-tecnologia', attivo: true },
  { id: 'art-scaldatazza-caricatore', nome: 'Scaldatazza con ricarica wireless', descrizione: 'Bambù: da una parte la tazza resta calda, dall’altra il telefono si ricarica senza fili, 10W.', crediti: 650, sconto: 0, offertaFino: null, scorta: null, immagine: 'scaldatazza-caricatore', pixelata: false, categoriaId: 'cat-tecnologia', attivo: true },
  { id: 'art-borraccia-speaker', nome: 'Borraccia termica con cassa Bluetooth', descrizione: 'Acciaio inox 500 ml, tiene caldo e freddo. Il tappo è una cassa da 3W, e il fondo magnetico regge il telefono.', crediti: 800, sconto: 0, offertaFino: null, scorta: null, immagine: 'borraccia-speaker', pixelata: false, categoriaId: 'cat-tecnologia', attivo: true },
  { id: 'art-auricolari-bluetooth', nome: 'Cuffie Bluetooth over-ear', descrizione: 'Padiglioni imbottiti, batteria 150 mAh. Bluetooth, o via cavo con il jack da 3,5 mm.', crediti: 850, sconto: 0, offertaFino: null, scorta: null, immagine: 'auricolari-bluetooth', pixelata: false, categoriaId: 'cat-tecnologia', attivo: true },
  { id: 'art-caricatore-tablet-lcd', nome: 'Postazione con lavagnetta LCD', descrizione: 'Fibra di grano, ABS e bambù. Ricarica wireless 15W, leggio per il telefono e lavagnetta su cui scrivere. Pennino e pila incluse.', crediti: 950, sconto: 0, offertaFino: null, scorta: null, immagine: 'caricatore-tablet-lcd', pixelata: false, categoriaId: 'cat-tecnologia', attivo: true },
  { id: 'art-orologio-intelligente', nome: 'Orologio intelligente', descrizione: 'Cinturino in pelle, schermo TFT da 1,32", batteria 300 mAh. Chiamate Bluetooth, battito, sonno, passi. Android e iOS.', crediti: 1500, sconto: 0, offertaFino: null, scorta: null, immagine: 'orologio-intelligente', pixelata: false, categoriaId: 'cat-tecnologia', attivo: true },
  { id: 'art-blocco-note-usb', nome: 'Quaderno con chiavetta USB', descrizione: 'Copertina rigida, cento fogli a righe, chiavetta da 16 GB nascosta nell’elastico. 14 × 21 cm.', crediti: 600, sconto: 0, offertaFino: null, scorta: null, immagine: 'blocco-note-usb', pixelata: false, categoriaId: 'cat-scrivania', attivo: true },
  { id: 'art-blocco-note-caricatore', nome: 'Quaderno con ricarica wireless', descrizione: 'Copertina rigida in poliestere riciclato RPET, ottanta fogli a righe. Ricarica il telefono appoggiandolo sopra, 10W.', crediti: 750, sconto: 0, offertaFino: null, scorta: null, immagine: 'blocco-note-caricatore', pixelata: false, categoriaId: 'cat-scrivania', attivo: true },
  { id: 'art-set-borraccia-blocco', nome: 'Set borraccia, quaderno e penna', descrizione: 'Borraccia termica in acciaio inox da 500 ml, quaderno e penna in fibra di tè. Nella sua scatola regalo.', crediti: 900, sconto: 0, offertaFino: null, scorta: null, immagine: 'set-borraccia-blocco', pixelata: false, categoriaId: 'cat-scrivania', attivo: true },
  { id: 'art-sacca-juta', nome: 'Sacca in juta e cotone', descrizione: 'Sacca a tracolla con chiusura a coulisse e tasca davanti. Ø 23 × 45 cm.', crediti: 300, sconto: 0, offertaFino: null, scorta: null, immagine: 'sacca-juta', pixelata: false, categoriaId: 'cat-borse', attivo: true },
  { id: 'art-sacca-termica', nome: 'Sacca termica in cotone riciclato', descrizione: 'Cotone riciclato 140 g/m² foderato in alluminio: tiene in fresco quello che ci metti. 38 × 42 cm.', crediti: 320, sconto: 0, offertaFino: null, scorta: null, immagine: 'sacca-termica', pixelata: false, categoriaId: 'cat-borse', attivo: true },
  { id: 'art-borsa-tela', nome: 'Borsa a tracolla in tela riciclata', descrizione: 'Tela riciclata 270 g/m², tracolla lunga e tasca esterna. 38 × 42 × 24 cm.', crediti: 350, sconto: 0, offertaFino: null, scorta: null, immagine: 'borsa-tela', pixelata: false, categoriaId: 'cat-borse', attivo: true },
  { id: 'art-zaino-rpet', nome: 'Zaino roll-top in RPET', descrizione: 'Poliestere riciclato 600D, chiusura ad arrotolare, schienale e spallacci imbottiti. 27 × 45 × 14 cm.', crediti: 700, sconto: 0, offertaFino: null, scorta: null, immagine: 'zaino-rpet', pixelata: false, categoriaId: 'cat-borse', attivo: true },
  { id: 'art-portadocumenti', nome: 'Borsa portadocumenti', descrizione: 'Tasca imbottita per il portatile fino a 15", tracolla regolabile. 40 × 32 × 9 cm.', crediti: 800, sconto: 0, offertaFino: null, scorta: null, immagine: 'portadocumenti', pixelata: false, categoriaId: 'cat-borse', attivo: true },
  { id: 'art-zaino-estensibile', nome: 'Zaino estensibile per portatile', descrizione: 'Poliestere 900D, si allarga quando serve. Tasca imbottita per il portatile fino a 15", schienale e spallacci imbottiti. 29 × 43 × 10 cm.', crediti: 900, sconto: 0, offertaFino: null, scorta: null, immagine: 'zaino-estensibile', pixelata: false, categoriaId: 'cat-borse', attivo: true },
];
