/* Le opportunita': qualcuno chiama, qualcuno propone, una porta si apre.
   Le tre porte che per «nessuna rete» non esistono stanno qui, con il
   loro id in `background.invisibili`: compaiono grigie, con scritto
   perche'. */
import { e, o } from './schema.js';

export default [
  e('head_hunter', 'opportunita', 'Ti chiama un head hunter',
    'Ha visto il tuo profilo. Un’azienda cerca uno come te, «più soldi e più responsabilità».',
    [
      o('ascolti', 'Ascolti', { ricerca: +3, visibilita: +1 }, { audace: true }),
      o('no', 'Non è il momento', { felicita: 0 }),
    ], { predefinita: 'no', quando: { lavoro: 'vero', livelloMin: 2, visibilitaMin: 25 }, peso: 1.2, unaVolta: false }),
  e('ex_collega_progetto', 'opportunita', 'Un ex collega ti propone un progetto',
    'Di sera, per tre mesi. Paga bene, e il portfolio cresce.',
    [
      o('accetti', 'Accetti', { tempo: -15, soldi: +1200, portfolio: +3, stress: +2, competenze: { gestione_progetti: +2 } }, { audace: true }),
      o('rifiuti', 'Rifiuti', { relazioni: 0 }),
    ], { predefinita: 'rifiuti', quando: { reteMin: 15, settimanaMin: 40 }, peso: 1, unaVolta: false }),
  e('offerta_spremitrice', 'opportunita', 'Più soldi, ma',
    'Un’azienda nota per spremere la gente ti offre il quaranta per cento in più. Tutti quelli che ci sono passati ne parlano male; tutti hanno il curriculum migliore.',
    [
      o('vai', 'Accetti il colloquio', { ricerca: +2, offerta: 'volturno' }, { audace: true }),
      o('resti', 'Resti dove sei', {}),
    ], { predefinita: 'resti', quando: { lavoro: 'vero', livelloMin: 1, settimanaMin: 30 }, peso: 0.8,
      lezione: 'Non deve esistere una risposta ovvia: a volte quei soldi servono davvero, a volte quella riga sul curriculum serve davvero. Sapere che cosa si sta comprando è l’unica cosa che conta.' }),
  e('offerta_estero', 'opportunita', 'Un’offerta all’estero',
    'Stipendio doppio, una città che non conosci, la famiglia a tremila chilometri.',
    [
      o('vai', 'Parti', { soldi: +6000, relazioni: -15, felicita: -3, rete: +8, competenze: { lingue: +4, resilienza: +2 }, stress: +2 }, { audace: true }),
      o('resti', 'Resti', { felicita: +1 }),
    ], { predefinita: 'resti', quando: { lavoro: 'vero', livelloMin: 2, settimanaMin: 80 }, peso: 0.6 }),
  e('startup_quote', 'opportunita', 'Quote invece dello stipendio',
    'Una startup ti offre di entrare: metà stipendio e una quota. Se va, sei a posto; se non va, hai lavorato due anni a metà prezzo.',
    [
      o('entri', 'Entri', { soldi: -4000, stress: +3, competenze: { tecnologia: +2, vendita: +2, negoziazione: +1 }, ritardo: { settimane: 52, effetti: { soldi: +9000, reputazione: +4 }, testo: 'La startup è andata bene: la quota vale qualcosa.' } }, { audace: true }),
      o('no', 'Troppo rischio', {}),
    ], { predefinita: 'no', quando: { livelloMin: 1, settimanaMin: 60 }, peso: 0.5, background: { nessuna: 0.3, operaia: 0.6 } }),
  e('corso_pagato', 'opportunita', 'Un corso pagato dall’azienda',
    'Tre settimane, a spese loro. Chi ci va sparisce dai progetti per un mese.',
    [
      o('vai', 'Ci vai', { tempo: -10, competenze: { analisi_dati: +2, gestione_progetti: +2, settore: +1 }, visibilita: -1 }, { audace: true }),
      o('no', 'Resti sui progetti', { visibilita: +1 }),
    ], { predefinita: 'no', quando: { lavoro: 'vero', settimanaMin: 20 }, peso: 1, unaVolta: false }),
  e('progetto_visibile', 'opportunita', 'Un progetto che vedono i piani alti',
    'Rischioso, in vista, e nessuno lo vuole. Chi lo prende, se va, lo ricordano.',
    [
      o('prendi', 'Lo prendi', { tempo: -10, stress: +3, visibilita: +8, performance: +2, competenze: { gestione_progetti: +2, leadership: +1 } }, { audace: true }),
      o('lasci', 'Lo lasci a qualcun altro', { visibilita: -1 }),
    ], { predefinita: 'lasci', quando: { lavoro: 'vero', performanceMin: 60 }, peso: 1, unaVolta: false,
      lezione: 'Lavorare bene non basta se nessuno che conta lo vede. Un progetto in vista è il modo più onesto di farsi vedere.' }),
  e('collega_in_difficolta', 'opportunita', 'Un collega in difficoltà',
    'Sta affogando in una consegna. Aiutarlo ti costa la settimana.',
    [
      o('aiuti', 'Lo aiuti', { tempo: -10, stress: +1, relazioni: +1, persona: { archetipo: 'alleato', fiducia: 55 }, competenze: { empatia: +1, lavoro_di_squadra: +2 } }, { audace: true }),
      o('no', 'Hai le tue cose', { integrita: 0 }),
    ], { predefinita: 'no', quando: { lavoro: 'vero', alleato: false }, peso: 1 }),
  e('conferenza', 'opportunita', 'Ti invitano a parlare a una conferenza',
    'Venti minuti davanti a duecento persone del settore.',
    [
      o('vai', 'Accetti', { tempo: -8, stress: +2, rete: +6, reputazione: +3, competenze: { comunicazione: +2 } }, { audace: true }),
      o('no', 'Declini', { stress: -1 }),
    ], { predefinita: 'no', quando: { reputazioneMin: 40, livelloMin: 2 }, peso: 0.8 }),
  e('mentore_offre', 'opportunita', 'Qualcuno che vuole insegnarti',
    'Una persona più avanti di te ti propone di vedervi ogni due settimane. Non chiede niente.',
    [
      o('accetti', 'Accetti', { persona: { archetipo: 'mentore', fiducia: 45 }, felicita: +1 }, { audace: true }),
      o('no', 'Non hai tempo', {}),
    ], { predefinita: 'no', quando: { mentore: false, reteMin: 10, settimanaMin: 20 }, peso: 0.9 }),
  e('mba_estero', 'opportunita', 'Un MBA all’estero',
    'Un anno, quarantamila euro, una rete che apre le porte grandi. Chi può, ci va.',
    [
      o('vai', 'Ci vai', { soldi: -40000, tempo: -30, rete: +15, reputazione: +5, titolo: 'universita', competenze: { finanza: +3, negoziazione: +3, leadership: +2, intelligenza_politica: +2 } }, { audace: true, richiede: { soldiMin: 20000 } }),
      o('no', 'No', {}),
    ], { quando: { settimanaMin: 150, livelloMin: 2 }, peso: 0.6, background: { nessuna: 0, operaia: 0, ceto_medio: 0.5 }, porta: true, predefinita: 'no',
      lezione: 'Quarantamila euro e un anno senza stipendio. Per chi li ha è una scelta; per chi non li ha non è nemmeno una porta.' }),
  e('anno_sabbatico', 'opportunita', 'Un anno sabbatico',
    'Fermarsi un anno. Viaggiare, pensare, tornare diversi. Costa un anno di stipendio e un buco nel curriculum che qualcuno saprà spiegare e qualcuno no.',
    [
      o('vai', 'Ti fermi un anno', { soldi: -12000, stress: -30, felicita: +15, salute: +10, noia: -40, tempo: -20, visibilita: -10 }, { audace: true, richiede: { soldiMin: 15000 } }),
      o('no', 'No', {}),
    ], { quando: { settimanaMin: 120, stressMin: 45 }, peso: 0.8, background: { nessuna: 0, operaia: 0.2 }, porta: true, predefinita: 'no' }),
  e('stage_non_pagato', 'opportunita', 'Uno stage non pagato',
    'Sei mesi in un posto che conta, a zero euro. Chi ci entra, dopo, entra ovunque.',
    [
      o('vai', 'Lo fai', { soldi: -3000, tempo: -30, reputazione: +6, rete: +8, competenze: { settore: +3, comunicazione: +1 }, ritardo: { settimane: 26, effetti: { offerta: 'meridian' }, testo: 'Lo stage è finito: Meridian ti vuole.' } }, { audace: true, richiede: { soldiMin: 4000 } }),
      o('no', 'Non puoi permettertelo', {}),
    ], { quando: { settimanaMin: 20, livelloMax: 1 }, peso: 0.8, background: { nessuna: 0, operaia: 0.3 }, porta: true, predefinita: 'no',
      lezione: 'Lo stage non pagato è la porta più chiusa di tutte: la vede solo chi può stare sei mesi senza stipendio. Non è un premio al merito.' }),
  e('freelance', 'opportunita', 'Un cliente tuo',
    'Qualcuno vuole pagarti per un lavoro tuo, fuori dall’azienda. Ottocento euro, un mese di sere.',
    [
      o('accetti', 'Accetti', { tempo: -12, soldi: +800, portfolio: +2, stress: +1, competenze: { vendita: +1, negoziazione: +1 } }, { audace: true }),
      o('no', 'No', {}),
    ], { predefinita: 'no', quando: { portfolioMin: 5 }, peso: 1, unaVolta: false }),
  e('borsa_studio', 'opportunita', 'Una borsa di studio',
    'Ci sono i requisiti. Copre due anni di università.',
    [
      o('chiedi', 'Fai domanda', { tempo: -5, ritardo: { settimane: 8, effetti: { soldi: +6000 }, testo: 'La borsa di studio è arrivata.' } }, { audace: true }),
      o('no', 'Non ti sembra per te', {}),
    ], { predefinita: 'no', quando: { percorso: ['universita'], settimanaMin: 10 }, peso: 1, background: { erede: 0, benestante: 0.2, nessuna: 2, operaia: 1.8 }, porta: true }),
  e('sponsor_nota', 'opportunita', 'Qualcuno in alto ti ha notato',
    'Un dirigente ti ha chiesto chi sei. Sarebbe il momento di farsi trovare.',
    [
      o('presenti', 'Ti presenti e proponi qualcosa', { visibilita: +5, sponsorFiducia: +10, stress: +1 }, { audace: true }),
      o('aspetti', 'Aspetti che venga lui', { visibilita: +1 }),
    ], { predefinita: 'aspetti', quando: { lavoro: 'vero', performanceMin: 70, visibilitaMin: 30 }, peso: 1 }),
  e('promozione_laterale', 'opportunita', 'Un altro reparto ti vuole',
    'Stesso livello, altro reparto: più vicino a dove si decide, ma tutto da rifare.',
    [
      o('vai', 'Vai', { visibilita: +6, performance: -8, noia: -20, competenze: { intelligenza_politica: +2 } }, { audace: true }),
      o('resti', 'Resti', { noia: +3 }),
    ], { predefinita: 'resti', quando: { lavoro: 'vero', livelloMin: 2, noiaMin: 15 }, peso: 0.8 }),
  e('ex_capo_chiama', 'opportunita', 'Ti chiama il tuo vecchio capo',
    'È in un’altra azienda, e cerca gente. Di te si fida.',
    [
      o('ascolti', 'Ascolti', { ricerca: +3, rete: +2 }, { audace: true }),
      o('no', 'No grazie', {}),
    ], { predefinita: 'no', quando: { lavoro: true, settimanaMin: 100, reteMin: 20 }, peso: 0.7 }),
  e('volontariato_chiama', 'opportunita', 'Un’associazione ti chiede di coordinare',
    'Dieci volontari, un progetto, nessun compenso. Si impara a guidare la gente dove non puoi ordinare niente.',
    [
      o('accetti', 'Accetti', { tempo: -8, competenze: { leadership: +3, empatia: +1, lavoro_di_squadra: +1 }, reputazione: +2, felicita: +2 }, { audace: true }),
      o('no', 'No', {}),
    ], { predefinita: 'no', quando: { settimanaMin: 30 }, peso: 0.8 }),
  e('articolo', 'opportunita', 'Scrivi un articolo',
    'Una rivista del settore ti chiede un pezzo. Non paga; si legge.',
    [
      o('scrivi', 'Lo scrivi', { tempo: -6, reputazione: +3, competenze: { comunicazione: +1, pensiero_critico: +1 }, portfolio: +1 }, { audace: true }),
      o('no', 'No', {}),
    ], { predefinita: 'no', quando: { reputazioneMin: 35, livelloMin: 1 }, peso: 0.7 }),
  e('cliente_grosso', 'opportunita', 'Il cliente più grosso dell’azienda',
    'Lo seguirai tu. Se va bene lo sanno tutti; se va male pure.',
    [
      o('prendi', 'Lo prendi', { stress: +3, visibilita: +6, competenze: { vendita: +2, negoziazione: +2 }, ritardo: { settimane: 8, effetti: { reputazione: +3, performance: +3 }, testo: 'Il cliente grosso è rimasto. Lo sanno tutti.' } }, { audace: true }),
      o('lasci', 'Chiedi che lo segua qualcuno più esperto', { visibilita: -2, stress: -1 }),
    ], { predefinita: 'lasci', quando: { lavoro: 'vero', livelloMin: 2, performanceMin: 65 }, peso: 0.8 }),
  e('rete_famiglia', 'opportunita', 'Una cena di famiglia utile',
    'C’è un amico dei tuoi che «conosce tutti». Basta chiedere.',
    [
      o('chiedi', 'Chiedi', { rete: +6, ricerca: +2, offerta: 'helvex' }, { audace: true }),
      o('no', 'Preferisci farcela da solo', { integrita: +1 }),
    ], { predefinita: 'no', quando: { settimanaMin: 10 }, peso: 1.2, background: { nessuna: 0, operaia: 0, ceto_medio: 0.3 }, porta: true,
      lezione: 'Fare networking con rete zero e senza soldi per l’aperitivo è quasi inutile. Con la rete di famiglia, una cena ti presenta un director. Non è merito né colpa: è da dove si parte.' }),
  e('proposta_impresa', 'opportunita', 'Mettersi in proprio',
    'Un amico ha un’idea e cerca un socio. Serve capitale, e coraggio.',
    [
      o('entri', 'Entri come socio', { soldi: -8000, tempo: -10, stress: +3, competenze: { vendita: +2, finanza: +2, negoziazione: +2 }, ritardo: { settimane: 60, effetti: { soldi: +14000, rete: +6 }, testo: 'L’impresa ha retto due anni: la quota rende.' } }, { audace: true, richiede: { soldiMin: 9000 } }),
      o('no', 'No', {}),
    ], { quando: { settimanaMin: 100, reteMin: 15 }, peso: 0.5, background: { erede: 1.5, nessuna: 0.3 }, predefinita: 'no' }),
  e('lingua_gratis', 'opportunita', 'Un corso di lingua gratis',
    'Il comune lo offre. Due sere a settimana per tre mesi.',
    [
      o('vai', 'Ci vai', { tempo: -6, competenze: { lingue: +3 }, felicita: +1 }, { audace: true }),
      o('no', 'No', {}),
    ], { predefinita: 'no', quando: { settimanaMin: 5 }, peso: 0.8 }),
  e('bonus', 'opportunita', 'Un bonus',
    'L’anno è andato bene: un premio di produzione.',
    [
      o('metti_via', 'Lo metti via', { soldi: +1500 }),
      o('spendi', 'Te lo godi', { soldi: +700, felicita: +4, relazioni: +2 }),
    ], { predefinita: 'metti_via', salto: false, quando: { lavoro: 'vero', performanceMin: 70, settimanaMin: 50 }, peso: 0.9, unaVolta: false }),
  e('gruppo_studio', 'opportunita', 'Un gruppo di studio',
    'Quattro compagni di corso. Si studia meglio, e fra dieci anni saranno manager.',
    [
      o('entri', 'Entri', { rete: +4, tempo: -4, competenze: { lavoro_di_squadra: +1 }, felicita: +1 }, { audace: true }),
      o('no', 'Studi da solo', {}),
    ], { predefinita: 'no', quando: { percorso: ['universita', 'its'], settimanaMin: 4 }, peso: 1 }),
  e('progetto_open', 'opportunita', 'Un progetto aperto',
    'Qualcuno ha visto il tuo portfolio e ti invita in un progetto con gente brava.',
    [
      o('entri', 'Entri', { tempo: -8, portfolio: +3, rete: +4, competenze: { tecnologia: +2, lavoro_di_squadra: +1 } }, { audace: true }),
      o('no', 'No', {}),
    ], { predefinita: 'no', quando: { portfolioMin: 6 }, peso: 1.2 }),
  e('apprendistato', 'opportunita', 'Un apprendistato vero',
    'Un artigiano del settore cerca un apprendista: paga poco, insegna tutto.',
    [
      o('vai', 'Vai', { soldi: -600, competenze: { settore: +4, resilienza: +1 }, felicita: +1 }, { audace: true }),
      o('no', 'No', {}),
    ], { predefinita: 'no', quando: { percorso: ['lavoro', 'its'], settimanaMin: 10, livelloMax: 1 }, peso: 0.8 }),
  e('secondo_lavoro', 'opportunita', 'Un secondo lavoro nel weekend',
    'Sabato e domenica. Soldi sicuri, e niente più weekend.',
    [
      o('prendi', 'Lo prendi', { tempo: -12, soldi: +900, relazioni: -2, felicita: -2, ritardo: { settimane: 4, effetti: { soldi: +900 }, testo: 'Il secondo mese di weekend.' } }, { audace: true }),
      o('no', 'No', {}),
    ], { predefinita: 'no', quando: { soldiMax: 1500 }, peso: 1, unaVolta: false, background: { erede: 0.05, benestante: 0.2 } }),
  e('team_lead_offerta', 'opportunita', 'Vuoi gestire persone?',
    'Il capo ti propone di guidare tre persone. Meno lavoro tecnico, più riunioni, più responsabilità.',
    [
      o('si', 'Sì', { competenze: { leadership: +3, empatia: +1 }, stress: +2, visibilita: +4, performance: -3 }, { audace: true }),
      o('no', 'Preferisci restare tecnico', { competenze: { tecnologia: +1 }, visibilita: -1 }),
    ], { predefinita: 'no', quando: { lavoro: 'vero', livelloMin: 2, livelloMax: 3, performanceMin: 65 }, peso: 1 }),
];
