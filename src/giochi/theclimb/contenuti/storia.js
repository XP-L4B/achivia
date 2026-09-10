/**
 * I testi che le schermate leggono: la storia che apre il gioco, le
 * parole delle statistiche, e come finisce.
 *
 * Stanno qui e non nelle pagine per la stessa ragione di The Boss: un
 * testo dentro un componente si corregge aprendo React, un testo qui si
 * corregge leggendo. E chi traduce un giorno il gioco sa dove guardare.
 *
 * La storia e' il tutorial. Dice le quattro cose che servono — sei
 * giovane, la vita che ti e' capitata e' quella, ogni settimana si decide
 * dove va il tempo, e ci sono quattro modi di finire male — senza
 * chiamarle regole. Si legge la prima volta e si rilegge dall'atrio.
 */

export const STORIA = [
  {
    id: 'inizio',
    titolo: 'Diciannove anni',
    testo: [
      'Hai diciannove anni e una vita che non hai scelto: una famiglia, una casa o nessuna, dei soldi o nessuno, dei contatti o nessuno. Da lì si parte, e da lì partono tutti — solo che non partono dallo stesso posto.',
      'La cima è lontana: dodici anni, una settimana alla volta. Nessuno ti chiede di arrivarci. Ti chiede di arrivare più in alto che puoi, e di arrivarci intero.',
    ],
  },
  {
    id: 'settimana',
    titolo: 'Una settimana',
    testo: [
      'Ogni settimana hai del tempo — non lo stesso per tutti — e lo dividi: lavoro, studio, persone, sonno, sport, progetti tuoi. Ogni cosa che fai muove qualcosa: le competenze crescono, i soldi entrano o escono, lo stress sale o scende.',
      'Il tempo non è l’unico limite. C’è l’energia, che dipende da come stai: chi dorme male e si trascura ne ha meno, e quello che fa oltre le sue forze lo paga in salute e sonno la settimana dopo.',
      'Se non decidi niente, vale la routine: quello che fai di solito. Puoi cambiarla quando vuoi.',
    ],
  },
  {
    id: 'fini',
    titolo: 'Come si finisce',
    testo: [
      'Ci sono quattro modi di finire prima del tempo. Il burnout, quando lo stress arriva a cento. Il bore-out, quando la noia ci arriva: un lavoro che non insegna niente svuota, e nessuno se ne accorge finché non è tardi. Il crollo fisico, quando il corpo non regge più. E i soldi, quando il rosso dura troppo — per chi ha una famiglia dietro c’è una mano, per gli altri no.',
      'Il gioco non nasconde i numeri. Ogni settimana ti dice che cosa è cambiato e perché. Leggilo: è l’unico modo di capire dove stavi sbagliando prima che diventi una fine.',
    ],
  },
];

/** Le statistiche come si leggono. Le chiavi sono quelle dello stato. */
export const NOMI = {
  salute: 'Salute',
  sonno: 'Debito di sonno',
  stress: 'Stress',
  felicita: 'Felicità',
  noia: 'Noia',
  soldi: 'Soldi',
  relazioni: 'Relazioni',
  rete: 'Rete',
  reputazione: 'Reputazione',
  integrita: 'Integrità',
  performance: 'Performance',
  visibilita: 'Visibilità',
  energia: 'Energia',
  titolo: 'Titolo',
  carriera: 'Carriera',
  azienda: 'Azienda',
};

/** Gli attributi di un'azienda, come si leggono. */
export const NOMI_ATTRIBUTI = {
  prestigio: 'Prestigio',
  cultura: 'Cultura',
  management: 'Qualità dei capi',
  formazione: 'Quanto si impara',
  equilibrio: 'Vita e lavoro',
  stabilita: 'Stabilità',
};

/**
 * Come e' finita, a parole. La causa e' quella che scrive il motore.
 *
 * Non c'e' un «hai vinto»: arrivare in fondo e' arrivare in fondo. Le
 * altre quattro non sono un rimprovero: dicono che cosa e' successo e da
 * dove veniva, che e' l'unica cosa utile da leggere a fine partita.
 */
export const FINALI = {
  cima: {
    titolo: 'CEO di ACHIVIA SPA',
    testo: 'Sei in cima. Da dove partivi, con la strada che hai preso, con le persone che hai tenuto e quelle che hai perso: è tutto scritto qui sotto. La maggior parte delle vite giocate qui non ci arriva, e non è una colpa — è il punto del gioco.',
  },
  tempo: {
    titolo: 'Dodici anni dopo',
    testo: 'Sei arrivato in fondo intero. Non è poco: la maggior parte delle vite giocate qui non ci arriva. Quello che hai costruito è scritto qui sotto.',
  },
  burnout: {
    titolo: 'Burnout',
    testo: 'Lo stress è arrivato a cento. Non è una debolezza tua: il burnout è quasi sempre il risultato di un ambiente — un posto che logora, un capo, una situazione economica che non permetteva di rallentare. Qui sotto c’è scritto quali fattori di questa vita l’hanno costruito, settimana dopo settimana.',
  },
  bore_out: {
    titolo: 'Bore-out',
    testo: 'Ti sei spento. Un lavoro che non insegnava niente, le stesse cose ogni settimana, e fuori dal lavoro niente che avesse un senso. La noia non fa rumore, ed è per questo che arriva fino in fondo.',
  },
  crollo_fisico: {
    titolo: 'Il corpo non ha retto',
    testo: 'Hai chiesto al corpo più di quello che aveva, per troppo tempo. L’energia che non c’era l’hai presa in prestito dalla salute, e a un certo punto non c’era più niente da prendere.',
  },
  crollo_economico: {
    titolo: 'I soldi sono finiti',
    testo: 'Il rosso è durato troppo, e non c’era nessuno a coprirlo. Da qui chi ha una famiglia riparte; chi non ce l’ha ricomincia da zero, e non è la stessa cosa.',
  },
  cima_vuota: {
    titolo: 'In cima, da soli',
    testo: 'Sei arrivato. La stanza è quella giusta, il nome sulla porta è il tuo. Fuori dalla stanza non c’è rimasto molto: le persone, la salute, le sere. È una vittoria — e la schermata lo dice — ma l’epilogo qui sotto racconta che cosa è costata.',
  },
  scandalo: {
    titolo: 'Lo scandalo',
    testo: 'È esploso. Non per sfortuna: per quello che avevi fatto, moltiplicato per quanto eri visibile. Chi bara e resta piccolo la passa liscia; tu eri salito. Le conseguenze erano scritte da settimane — solo che il sospetto non si vede.',
  },
  fermato: {
    titolo: 'Ti fermi qui',
    testo: 'Hai scelto di restare dove sei arrivato, con una buona vita. Non è una rinuncia: è una delle risposte giuste. La cima non era il punto; il punto era arrivare interi dove volevi arrivare.',
  },
  mollato: {
    titolo: 'Molli tutto',
    testo: 'Hai lasciato la scala e hai fatto altro. Il gioco non sa che cosa: sa che l’hai scelto tu, e che non è una sconfitta.',
  },
  impresa: {
    titolo: 'La tua azienda',
    testo: 'L’hai fondata, ha retto, e ACHIVIA l’ha comprata. Non sei salito la loro scala: ne hai costruita una tua. Succede di rado, e succede quasi sempre a chi aveva un capitale con cui cominciare.',
  },
  abbandono: {
    titolo: 'Lasciata a metà',
    testo: 'Questa vita è rimasta dov’era.',
  },
};

/** Le vittorie: arrivare in cima. L'impresa comprata e' un finale con
    dignita', non la vittoria: il brief dice «vittoria: diventi CEO». */
export const VITTORIE = new Set(['cima', 'cima_vuota']);

export const finaleDi = (causa) => FINALI[causa] || FINALI.abbandono;
