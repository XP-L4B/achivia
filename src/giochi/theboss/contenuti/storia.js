/**
 * La storia che apre la partita: tre schermate, e poi si lavora.
 *
 * Serve a due cose, e la seconda conta piu' della prima. Dice dove sei —
 * un'azienda di pozioni nel regno di Achivia, con una squadra di gente
 * strana — e insegna le regole senza chiamarle regole: che le risposte
 * sono tre, che dire sempre si' svuota la cassa, che dire sempre no svuota
 * l'officina, e che rimandare non e' una terza via ma la stessa cosa piu'
 * tardi e piu' grossa. Un tutorial che si legge come un racconto lo legge
 * qualcuno; una schermata di istruzioni no.
 *
 * Si salta, e chi la salta non perde niente di meccanico. Si rilegge dal
 * menu del gioco.
 */

export const AZIENDA = {
  nome: 'Alambicco & Soci',
  cosaFa: 'pozioni curative, anelli che si scaldano quando piove e polvere di teletrasporto',
  anni: 48,
};

export const STORIA = [
  {
    id: 'ditta',
    titolo: 'La ditta',
    testo: [
      'Il Gran Ciambellano di Achivia ti ha consegnato le chiavi e un registro con la copertina bruciacchiata.',
      `Dentro c'è scritto quello che possiedi: ${AZIENDA.nome}, ${AZIENDA.anni} anni di onorata produzione di ${AZIENDA.cosaFa} (garantita al 70%).`,
      'Il fondatore si è ritirato in campagna. La motivazione ufficiale è «riposo». Quella vera sta a pagina nove, dove qualcuno ha scritto a matita: non ce la faccio più con loro.',
    ],
  },
  {
    id: 'squadra',
    titolo: 'La squadra',
    testo: [
      'Loro sono i tuoi dipendenti.',
      'Un troll di pietra all’imbottigliamento, lentissimo, che in quattro anni non ha rotto una fiala. Uno scheletro alla contabilità, che non dorme e te lo fa pesare. Una melma ocra al controllo qualità: assaggia. Un goblin occultista che ha chiesto sette volte un budget per la ricerca e sette volte ha comprato candele. Un bardo halfling alle vendite, bravissimo, e lo sa.',
      'Sono strani. Sono anche gli unici che sanno fare quello che fanno.',
    ],
  },
  {
    id: 'lavoro',
    titolo: 'Il lavoro',
    testo: [
      'Trenta giorni. Bussano, chiedono, propongono. Tu hai il tempo di una giornata e tre risposte: sì, no, ne parliamo domani.',
      'Dire sempre sì ti svuota la cassa. Dire sempre no ti svuota l’officina. E «ne parliamo domani» arriva lo stesso, solo più tardi e più grosso.',
      'Il registro adesso lo tieni tu. Cerca di non scriverci niente a matita.',
    ],
  },
];
