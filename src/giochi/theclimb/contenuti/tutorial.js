/**
 * La guida della schermata, un pezzo alla volta.
 *
 * Nove passi, uno per ogni cosa che sta sullo schermo: la stanza, il
 * fumetto, la finestra, la targa, l'umore, i contatori, i tasti, i
 * comandi, e quello che succede. Ogni passo punta (`punta`) al pezzo di
 * schermata di cui parla, e la guida lo illumina; l'ultimo non punta a
 * niente, perche' parla di quello che compare da solo.
 *
 * Non spiega le regole del gioco — quelle si capiscono giocando, e la
 * storia all'inizio dice il resto — spiega dove guardare e dove
 * premere. Si vede da sola alla prima partita, e si riapre da «Come
 * funziona».
 */
export const PASSI_TUTORIAL = [
  {
    id: 'stanza',
    punta: '.tc-stanza',
    titolo: 'La stanza',
    testo: 'Questa è la tua vita, una settimana alla volta. In mezzo ci sei tu, con l’avatar del tuo profilo. La stanza non ha numeri: dice come stai con quello che c’è dentro — e i numeri stanno a lato.',
  },
  {
    id: 'fumetto',
    punta: '.tc-fumetto',
    titolo: 'Il fumetto',
    testo: 'Quello che dici questa settimana, scelto da come stai. Quando succede qualcosa — un lavoro preso, una mossa con una persona, una risposta a un evento — qui compare l’ultima cosa successa, con il suo perché.',
  },
  {
    id: 'cielo',
    punta: '.tc-cielo',
    titolo: 'La finestra',
    testo: 'Il cielo cambia con la stagione, e sotto c’è il mese. Cinquantadue settimane fanno un anno, e ne hai dodici: si parte a settembre, a diciannove anni.',
  },
  {
    id: 'targa',
    punta: '.tc-targa',
    titolo: 'La targa',
    testo: 'Dove lavori e a che livello. Senza un lavoro, la targa dice la strada che hai scelto. Quando finisci un percorso con un titolo, sul muro compare anche il diploma.',
  },
  {
    id: 'umore',
    punta: '.tc-figura',
    titolo: 'L’umore',
    testo: 'Accanto alla mano compare un segno quando qualcosa pesa: «!» lo stress, «zzz» il sonno arretrato, «…» la noia, «−€» il conto in rosso. E l’avatar lo fa vedere: trema sotto stress, ciondola senza sonno, sbiadisce quando si annoia.',
  },
  {
    id: 'cruscotto',
    punta: '.tc-cruscotto',
    titolo: 'I contatori',
    testo: 'Cinque barre — salute, stress, noia, felicità, sonno arretrato — gialle dove cominciano i segnali, rosse dove comincia il crollo. Sotto, i numeri: la settimana, l’età, i soldi, l’energia, il lavoro, le relazioni, la rete, la reputazione. Il sospetto non c’è: è nascosto, come nella vita.',
  },
  {
    id: 'tasti',
    punta: '.tc-tasti',
    titolo: 'I posti dove vai',
    testo: 'Ogni tasto apre una finestra sopra la stanza, e la finestra si chiude con la crocetta. Il primo è il piano della settimana: decidi dove va il tempo, e vedi quanta energia chiede. Poi il lavoro, le offerte, le porte — le aziende a cui bussare — le persone, le competenze, la strada, le scorciatoie, e le due porte per chiudere qui.',
  },
  {
    id: 'comandi',
    punta: '.tc-comandi',
    titolo: 'Vivere la settimana',
    testo: '«Vivi la settimana» gioca il piano e mostra il riepilogo: che cosa è cambiato, e perché. «Avanza un mese» ripete la routine per quattro settimane e si ferma da solo se succede qualcosa. È tutto salvato a ogni settimana: puoi uscire quando vuoi e ritrovi tutto com’era.',
  },
  {
    id: 'eventi',
    punta: null,
    titolo: 'Quello che succede',
    testo: 'Imprevisti, occasioni, bivi: compaiono sopra la stanza e aspettano una risposta prima della settimana dopo. L’opzione prudente è segnata, e il salto anche. Nessuna è quella giusta: scegliere è il gioco. Solo una cosa: chi lascia cadere le occasioni viene chiamato di meno.',
  },
];
