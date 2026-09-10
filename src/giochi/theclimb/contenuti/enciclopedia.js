/**
 * L'enciclopedia: le schede «Nella vita reale».
 *
 * Due-quattro frasi, linguaggio semplice, zero prediche: il tono e' quello
 * di un amico che ti spiega una cosa che nessuno ti aveva detto. Si
 * sbloccano man mano che si incontrano nel gioco: `quando` usa il
 * vocabolario degli eventi, `visto` chiede che una cosa sia successa
 * (una valutazione, un capo tossico, uno scandalo, un evento).
 */
export const SCHEDE = [
  {
    id: 'punto_di_partenza', titolo: 'Il punto di partenza',
    testo: 'Chi parte con soldi non compra solo cose: compra tempo, errori, secondi tentativi e persone da conoscere. Due persone identiche con background diversi non arrivano nello stesso posto. Riconoscerlo non toglie merito a nessuno: aiuta solo a capire la partita che si sta giocando.',
    quando: {}, visto: null,
  },
  {
    id: 'energia', titolo: 'L’energia',
    testo: 'Il tempo non è l’unico limite. Chi dorme male e si trascura ha meno energia, e quello che fa oltre le sue forze lo paga la settimana dopo. Non è pigrizia: è fisiologia.',
    quando: { settimanaMin: 2 }, visto: null,
  },
  {
    id: 'visibilita', titolo: 'La visibilità',
    testo: 'Lavorare bene non basta se nessuno che conta lo vede. Non è ingiusto per caso: chi decide le promozioni ha duecento persone sotto e ne conosce davvero venti. Farsi conoscere non è arroganza, è parte del lavoro.',
    quando: {}, visto: 'valutazione',
  },
  {
    id: 'soft_skill', titolo: 'Le competenze trasversali',
    testo: 'Più sali, meno conta quanto sei bravo a fare le cose e più conta quanto sei bravo con le persone. Un direttore non fa il lavoro: decide, convince, tiene insieme. Per questo empatia e comunicazione, che a scuola nessuno valuta, valgono più di qualsiasi certificazione.',
    quando: { livelloMin: 2 }, visto: null,
  },
  {
    id: 'sponsor', titolo: 'Lo sponsor',
    testo: 'Alle promozioni non decide chi lavora meglio, ma chi viene ritenuto pronto da chi ha potere di decidere. Uno sponsor è chi fa il tuo nome nelle stanze dove tu non sei. Farsi vedere e avere qualcuno che ti sostiene non è «leccare i piedi»: è una parte del lavoro che nessuno ti insegna.',
    quando: {}, visto: 'sponsor',
  },
  {
    id: 'mentore', titolo: 'Il mentore',
    testo: 'Diverso dallo sponsor: il mentore ti insegna, lo sponsor ti spinge. Il primo lo trovi facendo rete e ascoltando; rende moltissimo, ma piano. Le competenze trasversali crescono soprattutto così, stando vicino a chi le ha.',
    quando: { mentore: true }, visto: null,
  },
  {
    id: 'capo_tossico', titolo: 'Il capo tossico',
    testo: 'Ti carica, si prende i meriti, ti sminuisce davanti agli altri. Le opzioni esistono e costano tutte: documentare, andare da HR, cercare qualcuno più in alto, andartene. Subire costa di più — solo che si paga in silenzio, e si chiama burnout.',
    quando: {}, visto: 'tossico',
  },
  {
    id: 'hr', titolo: 'HR',
    testo: 'L’ufficio del personale tutela l’azienda. A volte coincide con tutelare te, a volte no. Non è il cattivo: è una funzione, e conviene sapere di chi. Con un dossier di date e mail funziona molto più spesso.',
    quando: { lavoro: 'vero' }, visto: null,
  },
  {
    id: 'manipolatore', titolo: 'Il collega manipolatore',
    testo: 'Sembra un amico. Ti ruba le idee e sparge voci. Riconoscerlo in tempo richiede intelligenza politica — capire le dinamiche di potere — che non è cinismo: è vedere quello che c’è.',
    quando: {}, visto: 'manipolatore',
  },
  {
    id: 'colloqui_mentono', titolo: 'I colloqui mentono',
    testo: 'Al colloquio l’azienda si racconta come vorrebbe essere. La cultura vera la vedi da dentro, dopo qualche settimana. Chiedere a chi ci ha lavorato vale più di qualsiasi presentazione.',
    quando: {}, visto: 'scoperta',
  },
  {
    id: 'muro_hard', titolo: 'Il muro delle sole competenze tecniche',
    testo: 'Fino a metà scala si sale sapendo fare le cose. Poi contano di più le persone, e chi ha investito solo in tecnica sbatte contro un muro che nessuno gli aveva descritto. Non si allena con i corsi: si allena con le persone.',
    quando: {}, visto: 'muro',
  },
  {
    id: 'burnout', titolo: 'Il burnout',
    testo: 'Non è una debolezza personale: è quasi sempre il risultato di un ambiente — un posto che logora, un capo, una situazione economica che non permette di rallentare. I segnali arrivano settimane prima: dormire male, saltare le cene, sbagliare. Ascoltarli è la cosa più difficile del gioco.',
    quando: { stressMin: 60 }, visto: null,
  },
  {
    id: 'bore_out', titolo: 'Il bore-out',
    testo: 'Il contrario del burnout, e finisce nello stesso posto: un lavoro che non insegna niente svuota. La noia non fa rumore. Si scarica con quello che ha un senso — progetti, studio, le persone — o cambiando posto.',
    quando: { noiaMin: 40 }, visto: null,
  },
  {
    id: 'occasioni', titolo: 'Le occasioni',
    testo: 'Essere prudenti costa anche quello: chi lascia cadere le occasioni viene chiamato di meno, chi si lancia di più. Non tutte le occasioni vanno prese — ma non prenderne mai nessuna è una scelta, e ha un prezzo che non si vede.',
    quando: { settimanaMin: 10 }, visto: 'occasione',
  },
  {
    id: 'porte_chiuse', titolo: 'Le porte chiuse',
    testo: 'Lo stage non pagato, l’MBA all’estero, l’anno sabbatico: porte che si vedono solo se ci si può permettere di attraversarle. Non sono premi al merito. Chi non le ha non le vede nemmeno — e per questo il gioco le mostra grigie.',
    quando: {}, visto: 'porta_chiusa',
  },
  {
    id: 'integrita', titolo: 'L’integrità e il sospetto',
    testo: 'Barare funziona, all’inizio. Ogni scorciatoia rende subito e lascia una traccia che non vedi; la traccia esplode con quanto sei visibile. Chi bara e resta piccolo la passa liscia; chi bara e sale viene scoperto. E c’è una strada per riparare: lunga, e costa.',
    quando: {}, visto: 'scorciatoia',
  },
  {
    id: 'scandalo', titolo: 'Lo scandalo',
    testo: 'Quando esplode, non è sfortuna: è quello che avevi fatto, moltiplicato per quanto eri in vista. Le persone che hai danneggiato tornano nei momenti decisivi, e un nome sui giornali resta.',
    quando: {}, visto: 'scandalo',
  },
  {
    id: 'memoria', titolo: 'Le persone hanno memoria',
    testo: 'Chi hai aiutato quando era in basso fa il tuo nome anni dopo, da un’altra azienda. Chi hai fregato ti aspetta a un colloquio. È la ricompensa più lenta del gioco, e la più sicura.',
    quando: {}, visto: 'memoria',
  },
  {
    id: 'controfferta', titolo: 'La controfferta',
    testo: 'Chi resta dopo aver detto «me ne vado» resta con un’etichetta addosso. Le controfferte si accettano poco, nella vita reale; e quando si accettano, sei mesi dopo se ne ricordano.',
    quando: {}, visto: 'evento:contro_offerta',
  },
  {
    id: 'sindacato', titolo: 'Il sindacato e la legge',
    testo: 'Straordinari non pagati, ferie negate, contratti capestro: documentare, rivolgersi a un sindacato, chiedere una consulenza legale funzionano più spesso di quanto si creda — e costano più di quanto si dica, in reputazione, per un po’.',
    quando: {}, visto: 'evento:straordinari_non_pagati',
  },
  {
    id: 'impresa', titolo: 'Mettersi in proprio',
    testo: 'È la scorciatoia più rapida verso l’alto, quando riesce. Riesce di rado, e riesce molto più spesso a chi aveva un capitale con cui partire e una rete che lo tenesse se cadeva.',
    quando: {}, visto: 'impresa',
  },
  {
    id: 'fermarsi', titolo: 'Fermarsi',
    testo: 'Arrivare più in alto possibile non è l’unica risposta giusta. Fermarsi dove si sta bene, con le persone e la salute intere, è una delle altre. Il gioco lo conta come un finale, non come una rinuncia.',
    quando: { settimanaMin: 104 }, visto: null,
  },
];

export const schedaById = (id) => SCHEDE.find((s) => s.id === id) || null;
