/**
 * Lo sfondo vivo: il cielo che passa, e il paesaggio che ci sta davanti.
 *
 * Non c'e' piu' un'immagine di sfondo. Ci sono due cose sovrapposte:
 *
 *   il cielo        lo disegna il codice — una sfumatura di nove tappe, il
 *                   cui colore e' quello esatto dell'ora di chi guarda
 *                   (`cielo.js`). Non due immagini in dissolvenza: il
 *                   colore delle 18:07, alle 18:07.
 *
 *   il primo piano  castello, borghi e montagne, ritagliati col cielo
 *                   trasparente. Quattro luci — alba, giorno, tramonto,
 *                   notte con le finestre accese — che si danno il cambio
 *                   in dissolvenza mentre sotto il cielo scorre continuo.
 *
 * Fra i due stanno le stelle, il sole e la luna. Ed e' tutto qui il motivo
 * per cui vale la pena: stando *sotto* il paesaggio, il sole sorge da
 * dietro una cresta e ci tramonta dietro, invece di passarci davanti come
 * un adesivo; e una stella vicina a una vetta viene tagliata dalla vetta,
 * non appoggiata sopra.
 *
 * L'ordine, dal fondo: cielo, stelle, sole e luna, paesaggio, velo.
 *
 * Le stelle
 * ─────────
 * [x, y, luminosita']. Prima bisognava cercare il profilo delle montagne
 * colonna per colonna per non appoggiarne una su una vetta; adesso le
 * copre il paesaggio, e basta chiedere all'alfa del ritaglio dove il cielo
 * si vede. Non compaiono e non spariscono tutte insieme: la sera se ne
 * vedono prima due o tre, poi dieci, poi tutte, e l'ordine lo da' la
 * luminosita' — le piu' forti arrivano per prime e se ne vanno per ultime,
 * come succede davvero.
 *
 * Le misure — 1080x1080, 810x1080, 1920x1080 — sono la tela in cui vivono
 * queste coordinate, e ci vivranno la porta del castello e il drago.
 *
 *   larga     il quadro, per tablet e telefoni girati di lato
 *   stretta   lo stesso quadro gia' ritagliato per il telefono
 *   desktop   un disegno suo, in sedici noni
 */

import { useEffect, useState } from 'react';
import { cieloOra, sfumatura, FASI } from '../../data/cielo';
import useScrivania from '../../hooks/useScrivania';
import luna from '../../assets/ui/luna.png';

const STELLE_LARGA = {
  w: 1080,
  h: 1080,
  stelle: [
    [74, 94, 208], [598, 69, 186], [838, 52, 136], [952, 88, 205],
    [1070, 94, 155], [60, 147, 151], [70, 154, 181], [226, 129, 180],
    [355, 163, 134], [510, 122, 154], [571, 123, 129], [720, 137, 187],
    [661, 205, 209], [839, 205, 168], [1073, 224, 120], [570, 261, 183],
    [715, 275, 148], [773, 284, 156], [871, 248, 131], [178, 344, 182],
    [323, 334, 204], [481, 360, 198], [645, 352, 168], [769, 342, 126],
    [887, 330, 209], [993, 335, 187], [239, 371, 178], [323, 376, 124],
    [449, 372, 136], [700, 362, 174], [854, 369, 209], [232, 428, 134],
    [724, 436, 127],
  ],
};

const STELLE_STRETTA = {
  w: 810,
  h: 1080,
  stelle: [
    [74, 52, 208], [586, 69, 186], [742, 82, 136], [28, 106, 205],
    [152, 118, 155], [192, 141, 151], [292, 124, 181], [418, 105, 180],
    [493, 103, 134], [654, 98, 154], [697, 93, 129], [786, 125, 187],
    [163, 259, 209], [263, 271, 168], [491, 254, 120], [216, 291, 183],
    [301, 299, 148], [413, 290, 156], [505, 284, 131], [28, 380, 182],
    [143, 388, 204], [355, 336, 198], [459, 358, 168], [565, 384, 126],
    [677, 372, 209], [795, 335, 187], [2, 394, 161], [113, 399, 188],
    [251, 401, 178], [347, 436, 124], [479, 426, 136], [577, 412, 158],
    [706, 410, 174],
  ],
};

const STELLE_DESKTOP = {
  w: 1920,
  h: 1080,
  stelle: [
    [134, 88, 208], [694, 69, 186], [898, 70, 136], [1012, 34, 205],
    [1160, 46, 155], [1248, 93, 151], [1348, 40, 181], [1462, 33, 180],
    [1597, 43, 134], [1770, 62, 154], [1825, 45, 129], [54, 173, 187],
    [1255, 151, 209], [1403, 115, 168], [1727, 110, 120], [408, 183, 183],
    [505, 203, 148], [641, 230, 156], [781, 224, 131], [1168, 224, 182],
    [1331, 232, 204], [1519, 204, 198], [1659, 178, 168], [1825, 192, 126],
    [53, 312, 209], [147, 311, 187], [278, 262, 161], [293, 291, 188],
    [527, 305, 178], [647, 256, 124], [731, 294, 136], [913, 268, 158],
    [1078, 254, 174], [1184, 315, 209], [1550, 257, 141], [1629, 268, 146],
    [1792, 296, 134], [72, 322, 155], [144, 320, 127], [352, 328, 127],
    [538, 384, 128], [635, 348, 177], [901, 391, 120], [957, 337, 177],
    [1141, 320, 132], [1271, 387, 120], [1317, 366, 183], [514, 457, 155],
    [851, 397, 136], [1059, 422, 144], [1087, 419, 135], [1356, 437, 204],
    [812, 478, 186], [1188, 517, 170],
  ],
};

// I tre periodi chiesti dal disegno, con la classe che li porta nel foglio
// di stile e i secondi che servono qui per distribuire i ritardi.
const PERIODI = [
  { classe: 'a-cinque', secondi: 5 },
  { classe: 'a-sette', secondi: 7 },
  { classe: 'a-dieci', secondi: 10 },
];

/* Su quale tratto di cielo una stella si accende e si spegne: la fetta di
   quota fra il "non c'e'" e il "c'e' tutta". Corta, ma non zero. */
const RAMPA = 0.14;

/** Numero stabile ricavato dalle coordinate di una stella. */
const impronta = (x, y, i) => Math.abs((x * 73856093) ^ (y * 19349663) ^ (i * 83492791));

/**
 * A quale periodo tocca ogni stella, e con quanto ritardo.
 *
 * Non e' un sorteggio: e' un conto fatto sulle coordinate, quindi il cielo
 * e' sempre lo stesso e un ridisegno della pagina non rimescola le luci. Il
 * periodo pero' non si prende dal resto dell'impronta — verrebbe un cielo
 * sbilanciato, con meta' delle stelle su uno solo dei tre tempi: le stelle
 * si mettono in fila per impronta e i tre periodi si distribuiscono su
 * quella fila.
 */
function ritmi(stelle) {
  const ordine = stelle
    .map(([x, y], i) => ({ i, n: impronta(x, y, i) }))
    .sort((a, b) => a.n - b.n);
  const fuori = [];
  ordine.forEach(({ i, n }, posto) => {
    const periodo = PERIODI[posto % PERIODI.length];
    fuori[i] = {
      classe: periodo.classe,
      ritardo: `${(n % (periodo.secondi * 10)) / 10}s`,
    };
  });
  return fuori;
}

/**
 * A che punto della notte compare ogni stella.
 *
 * Il cielo non si accende tutto insieme: la fila la decide la luminosita',
 * e ognuna prende la sua soglia lungo quella fila. La stessa stella
 * compare sempre allo stesso momento della sera.
 */
function soglie(stelle) {
  const fila = stelle
    .map(([, , luminosita], i) => ({ i, luminosita }))
    .sort((a, b) => b.luminosita - a.luminosita);
  const fuori = [];
  fila.forEach(({ i }, posto) => {
    fuori[i] = (posto + 1) / (fila.length + 1);
  });
  return fuori;
}

/** Quanto e' accesa una stella la cui soglia e' questa, con questa quota. */
const accesa = (soglia, quota) => Math.min(1, Math.max(0, (quota - soglia) / RAMPA + 1));

/** Quanto arriva a farsi luminoso l'alone: le stelle deboli restano deboli. */
const forzaStella = (luminosita) => (0.4 + (Math.min(luminosita, 210) / 210) * 0.5).toFixed(2);

function Cielo({ dati, nome, quota }) {
  const alone = `mo-alone-${nome}`;
  const tempi = ritmi(dati.stelle);
  const soglia = soglie(dati.stelle);
  return (
    <svg
      className={`mo-cielo mo-${nome}`}
      viewBox={`0 0 ${dati.w} ${dati.h}`}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        {/* L'alone e' un tondo sfumato che si spegne sul bordo: sul cielo
            non deve comparire un cerchio, deve comparire una luce. */}
        <radialGradient id={alone}>
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="0.35" stopColor="#dff2ff" stopOpacity="0.45" />
          <stop offset="1" stopColor="#dff2ff" stopOpacity="0" />
        </radialGradient>
      </defs>
      {dati.stelle.map(([x, y, l], i) => {
        const { classe, ritardo } = tempi[i];
        const luce = accesa(soglia[i], quota);
        // Una stella che non c'e' non sta in pagina spenta: sono cento
        // elementi con un'animazione addosso, e per meta' giornata non
        // servono a niente.
        if (luce <= 0) return null;
        return (
          // L'opacita' sta qui e non sui due cerchi: quella dell'alone la
          // guida gia' l'animazione, e le due si moltiplicano da sole.
          <g key={`${x}-${y}`} opacity={luce}>
            <circle className="mo-stella-punto" cx={x} cy={y} r="1.6" fill="#eaf4ff" opacity={forzaStella(l)} />
            <circle
              className={`mo-stella ${classe}`}
              cx={x}
              cy={y}
              r="9"
              fill={`url(#${alone})`}
              style={{ '--mo-ritardo': ritardo, '--mo-forza': forzaStella(l) }}
            />
          </g>
        );
      })}
    </svg>
  );
}

/**
 * Sole e luna, dove li mette l'orologio.
 *
 * Non hanno bisogno delle coordinate del disegno: stanno in percentuale
 * sulla finestra, quindi un'unica coppia serve tutti e tre i formati.
 * Il sole e' disegnato qui — una sfera di luce, che un file non renderebbe
 * meglio; la luna e' il file di Riccardo, con un bagliore attorno.
 */
function Astri({ cielo }) {
  return (
    <>
      {cielo.sole.visibile && (
        <div className="mo-sole" style={{ left: `${cielo.sole.x}%`, top: `${cielo.sole.y}%` }} />
      )}
      {cielo.luna.visibile && (
        <img className="mo-luna" src={luna} alt="" style={{ left: `${cielo.luna.x}%`, top: `${cielo.luna.y}%` }} />
      )}
    </>
  );
}

/**
 * Il cielo di adesso, ricontrollato ogni minuto.
 *
 * Ogni minuto e non ogni secondo perche' in un minuto il sole si sposta di
 * un quarto di grado: nessuno lo vede, e sessanta conti al minuto per
 * niente si sentono sulla batteria. Quando la scheda non e' in primo piano
 * il conto si ferma del tutto, e riparte guardando l'ora vera: chi torna
 * dopo tre ore trova il cielo giusto, non quello di quando se n'e' andato.
 */
function useCielo(formato) {
  const [cielo, setCielo] = useState(() => cieloOra(formato));

  useEffect(() => {
    let orologio = null;
    const aggiorna = () => setCielo(cieloOra(formato));
    const parti = () => {
      aggiorna();
      orologio = setInterval(aggiorna, 60000);
    };
    const fermati = () => {
      if (orologio) clearInterval(orologio);
      orologio = null;
    };
    const cambio = () => (document.visibilityState === 'hidden' ? fermati() : parti());

    parti();
    document.addEventListener('visibilitychange', cambio);
    return () => {
      fermati();
      document.removeEventListener('visibilitychange', cambio);
    };
  }, [formato]);

  return cielo;
}

export default function SfondoVivo() {
  // Il disegno da scrivania e' un altro quadro, con un'altra alba: la
  // tavolozza del cielo cambia con lui.
  const scrivania = useScrivania();
  const cielo = useCielo(scrivania ? 'scrivania' : 'quadro');

  return (
    <div className="mo-sfondo" aria-hidden="true">
      <div className="mo-aria" style={{ background: sfumatura(cielo.tappe) }} />

      {/* Le stelle non si spengono tutte insieme: se ne vanno una alla
          volta, dalla piu' debole alla piu' forte. Di giorno il livello
          non c'e' proprio. */}
      {cielo.stelle > 0 && (
        <div className="mo-stelle">
          <Cielo dati={STELLE_LARGA} nome="larga" quota={cielo.stelle} />
          <Cielo dati={STELLE_STRETTA} nome="stretta" quota={cielo.stelle} />
          <Cielo dati={STELLE_DESKTOP} nome="desktop" quota={cielo.stelle} />
        </div>
      )}

      <Astri cielo={cielo} />

      {/* Il paesaggio, davanti a tutto quello che e' cielo. Due luci alla
          volta, una sopra l'altra, con l'opacita' che dice a che punto e'
          il passaggio; il browser scarica solo quelle due. */}
      {FASI.map((fase) => {
        const sopra = fase === cielo.prossima;
        const sotto = fase === cielo.fase;
        if (!sopra && !sotto) return null;
        return (
          <div
            key={fase}
            className={`mo-primopiano fase-${fase}`}
            style={{ opacity: sopra && !sotto ? cielo.mescola : 1, zIndex: sopra && !sotto ? 4 : 3 }}
          />
        );
      })}

      {/* Il velo: l'interfaccia e' nata su un cielo notturno, e un
          mezzogiorno luminoso se la mangia. Di notte vale zero. */}
      <div className="mo-velo" style={{ opacity: cielo.velo }} />
    </div>
  );
}
