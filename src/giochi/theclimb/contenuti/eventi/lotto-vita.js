/* La vita privata: quello che succede fuori dal lavoro, e che ha effetti
   veri su tempo, soldi e felicita'. Devono essere desiderabili, non solo
   penalita': una relazione che nasce e' una cosa bella che costa tempo. */
import { e, o } from './schema.js';

export default [
  e('relazione_nasce', 'vita', 'Qualcuno',
    'Vi vedete da un mese. È una cosa bella, e vuole del tempo.',
    [
      o('dai', 'Le dai spazio', { relazioni: +6, felicita: +5, tempo: -8, stress: -2 }),
      o('poco', 'Poco: adesso è un momento pieno', { relazioni: +1, felicita: +1 }),
    ], { quando: { settimanaMin: 10, relazioniMin: 20 }, peso: 1.2 }),
  e('convivenza', 'vita', 'Andare a vivere insieme',
    'Un affitto in due costa meno, e una casa in due non è la stessa casa.',
    [
      o('si', 'Sì', { soldi: +200, felicita: +4, relazioni: +4, ritardo: { settimane: 4, effetti: { soldi: +200 }, testo: 'L’affitto diviso in due.' } }),
      o('no', 'Non ancora', { relazioni: -2 }),
    ], { quando: { settimanaMin: 60, relazioniMin: 55 }, peso: 0.9 }),
  e('rottura', 'vita', 'È finita',
    'Non c’è una ragione sola. Adesso c’è una casa mezza vuota e molte sere.',
    [
      o('elabori', 'Ti prendi il tempo', { felicita: -6, stress: +2, tempo: -6, relazioni: -3, competenze: { resilienza: +2 } }),
      o('lavori', 'Ti butti nel lavoro', { felicita: -6, stress: +4, performance: +2, relazioni: -6 }),
    ], { quando: { settimanaMin: 80, relazioniMin: 40, stressMin: 45 }, peso: 0.7 }),
  e('figlio', 'vita', 'Un figlio',
    'Arriva. Cambia il tempo, i soldi, il sonno, e quello che conta.',
    [
      o('accogli', 'Cambi tutto', { felicita: +8, relazioni: +6, tempo: -20, sonno: +4, soldi: -400, ritardo: { settimane: 4, effetti: { soldi: -400 }, testo: 'Il primo mese con il bambino.' } }),
      o('meta', 'Provi a tenere tutto come prima', { felicita: +3, relazioni: -3, stress: +5, sonno: +5, tempo: -10 }),
    ], { quando: { settimanaMin: 150, relazioniMin: 55, etaMin: 24 }, peso: 0.6 }),
  e('amico_si_allontana', 'vita', 'Un amico che non chiama più',
    'Hai detto di no a tre cene. Alla quarta non ti ha invitato.',
    [
      o('recuperi', 'Lo chiami tu', { relazioni: +3, tempo: -4, felicita: +2 }),
      o('lasci', 'Lasci andare', { relazioni: -5, felicita: -2 }),
    ], { quando: { relazioniMax: 45, settimanaMin: 20 }, peso: 1, unaVolta: false }),
  e('matrimonio', 'vita', 'Il matrimonio di tua sorella',
    'È di sabato, in un’altra regione, e c’è una consegna lunedì.',
    [
      o('vai', 'Vai', { relazioni: +5, felicita: +4, tempo: -6, performance: -1, soldi: -300 }),
      o('non_vai', 'Non vai', { relazioni: -8, felicita: -4, performance: +1 }),
    ], { quando: { settimanaMin: 40, lavoro: true }, peso: 0.8 }),
  e('genitore_invecchia', 'vita', 'Tua madre invecchia',
    'Non è malata; ha bisogno di te più spesso. Una visita a settimana, almeno.',
    [
      o('ci_vai', 'Ci vai', { tempo: -6, relazioni: +3, felicita: +1 }),
      o('quando_puoi', 'Quando puoi', { relazioni: -2, felicita: -1 }),
    ], { quando: { settimanaMin: 200 }, peso: 0.8 }),
  e('viaggio', 'vita', 'Un viaggio con gli amici',
    'Dieci giorni. Costa, e ti ricarica.',
    [
      o('vai', 'Vai', { soldi: -900, stress: -8, felicita: +5, relazioni: +3, tempo: -10 }),
      o('no', 'Non puoi', { felicita: -2, relazioni: -2 }),
    ], { quando: { relazioniMin: 35, settimanaMin: 25 }, peso: 1, unaVolta: false, background: { nessuna: 0.5 } }),
  e('trasloco', 'vita', 'Cambiare casa',
    'Una casa più vicina al lavoro: più cara, ma un’ora al giorno in più.',
    [
      o('vai', 'Traslochi', { soldi: -1200, tempo: +6, stress: +2, ritardo: { settimane: 4, effetti: { soldi: -120 }, testo: 'L’affitto più caro.' } }),
      o('resti', 'Resti', {}),
    ], { quando: { lavoro: 'vero', settimanaMin: 30, soldiMin: 2000 }, peso: 0.7 }),
  e('hobby', 'vita', 'Una cosa che ti piace',
    'Hai ricominciato a suonare. Non serve a niente, e serve a tutto.',
    [
      o('tieni', 'Ti tieni due sere', { tempo: -4, felicita: +4, stress: -3, noia: -8, competenze: { creativita: +2 } }),
      o('no', 'Non c’è tempo', { felicita: -1 }),
    ], { quando: { stressMin: 40 }, peso: 1 }),
  e('nonno_muore', 'vita', 'Tuo nonno',
    'Se n’è andato. Il funerale è giovedì.',
    [
      o('vai', 'Vai, e resti qualche giorno', { tempo: -8, relazioni: +2, felicita: -3, stress: +1 }),
      o('giorno', 'Vai solo il giorno', { tempo: -2, relazioni: -1, felicita: -3 }),
    ], { quando: { settimanaMin: 100 }, peso: 0.6 }),
  e('cane', 'vita', 'Un cane',
    'Il rifugio ne ha uno che ti guarda. Due passeggiate al giorno, per dodici anni.',
    [
      o('prendi', 'Lo prendi', { felicita: +4, salute: +2, tempo: -5, soldi: -60, relazioni: +1 }),
      o('no', 'No', {}),
    ], { quando: { settimanaMin: 50, soldiMin: 1000 }, peso: 0.6 }),
  e('insonnia', 'vita', 'Non dormi',
    'Da tre settimane. Ti giri, guardi il soffitto, alle sei ti alzi.',
    [
      o('medico', 'Vai dal medico', { soldi: -120, sonno: -3, stress: -2 }),
      o('tieni', 'Tieni duro', { sonno: +3, stress: +2, salute: -1 }),
    ], { quando: { stressMin: 60 }, peso: 1.2, unaVolta: false }),
  e('terapia_consiglio', 'vita', 'Qualcuno ti dice di parlare con qualcuno',
    'Un’amica te lo dice con delicatezza. Hai le occhiaie e ridi meno.',
    [
      o('vai', 'Prendi un appuntamento', { soldi: -80, stress: -4, felicita: +2, competenze: { resilienza: +1 } }),
      o('no', 'Stai bene', { stress: +1 }),
    ], { quando: { stressMin: 65, relazioniMin: 30 }, peso: 1, unaVolta: false }),
  e('compleanno', 'vita', 'Trent’anni',
    'Una festa, o una sera da soli a fare i conti.',
    [
      o('festa', 'Una festa', { soldi: -300, felicita: +4, relazioni: +4 }),
      o('conti', 'I conti', { felicita: -1, competenze: { pensiero_critico: +1 } }),
    ], { quando: { etaMin: 30 }, peso: 2 }),
  e('amico_ospita', 'vita', 'Un amico ha bisogno di un letto',
    'Per un mese. Il divano è tuo, la privacy no.',
    [
      o('si', 'Sì', { relazioni: +4, felicita: -1, stress: +1, persona: { archetipo: 'alleato', fiducia: 60 } }),
      o('no', 'No', { relazioni: -3 }),
    ], { quando: { relazioniMin: 40, settimanaMin: 30 }, peso: 0.7 }),
  e('sport_squadra', 'vita', 'Una squadra',
    'Calcetto il martedì. Gente nuova, una birra dopo.',
    [
      o('entri', 'Entri', { tempo: -3, salute: +2, relazioni: +2, rete: +1, felicita: +2 }),
      o('no', 'No', {}),
    ], { quando: { settimanaMin: 8 }, peso: 0.8 }),
  e('coinquilino', 'vita', 'Il coinquilino se ne va',
    'Da domani l’affitto è tutto tuo, finché non trovi qualcuno.',
    [
      o('cerchi', 'Cerchi qualcuno', { tempo: -4, soldi: -300, stress: +1 }),
      o('solo', 'Resti da solo', { soldi: -300, felicita: +1, ritardo: { settimane: 4, effetti: { soldi: -300 }, testo: 'L’affitto intero, il secondo mese.' } }),
    ], { quando: { settimanaMin: 20, nonBackground: ['erede', 'benestante'] }, peso: 0.7 }),
  e('litigio_famiglia', 'vita', 'Un litigio a casa',
    'Con tuo padre. Sul lavoro, su come vivi. Le parole grosse.',
    [
      o('ricuci', 'Ricuci', { tempo: -3, relazioni: +2, felicita: +1, competenze: { empatia: +1 } }),
      o('lasci', 'Lasci passare', { relazioni: -4, felicita: -2, stress: +1 }),
    ], { quando: { relazioniMin: 30, settimanaMin: 40 }, peso: 0.7 }),
  e('rimesse_aumentano', 'vita', 'A casa serve di più',
    'Tua madre ha perso il lavoro. Cento euro in più al mese, da te.',
    [
      o('mandi', 'Mandi', { soldi: -100, relazioni: +2, ritardo: { settimane: 4, effetti: { soldi: -100 }, testo: 'Cento euro a casa, un altro mese.' } }),
      o('non_puoi', 'Non puoi', { relazioni: -4, felicita: -3 }),
    ], { quando: { background: ['operaia', 'nessuna'], settimanaMin: 30 }, peso: 1.2 }),
  e('vacanza_lavoro', 'vita', 'Le ferie',
    'Due settimane. Il capo ha fatto una faccia.',
    [
      o('vai', 'Vai', { stress: -10, felicita: +4, salute: +2, visibilita: -2, soldi: -500 }),
      o('rinunci', 'Rinunci', { stress: +3, felicita: -3, visibilita: +1 }),
    ], { quando: { lavoro: 'vero', stressMin: 50 }, peso: 1, unaVolta: false }),
  e('fede', 'vita', 'Una comunità',
    'Una parrocchia, un circolo, un gruppo. Gente che c’è.',
    [
      o('entri', 'Entri', { relazioni: +4, felicita: +2, tempo: -3, competenze: { empatia: +1 } }),
      o('no', 'No', {}),
    ], { quando: { relazioniMax: 40 }, peso: 0.7 }),
  e('salute_spavento', 'vita', 'Uno spavento',
    'Un dolore al petto. Al pronto soccorso: «ansia». Ma ti sei spaventato.',
    [
      o('cambi', 'Cambi qualcosa', { stress: -5, salute: +2, felicita: +1, tempo: -4 }),
      o('niente', 'Niente', { stress: +2 }),
    ], { quando: { stressMin: 70 }, peso: 1.2, unaVolta: false }),
  e('eredita_piccola', 'vita', 'Una piccola eredità',
    'Una zia. Tremila euro, e un armadio.',
    [
      o('metti', 'Metti via', { soldi: +3000 }),
      o('festeggi', 'Fai una cosa che volevi fare', { soldi: +1500, felicita: +5 }),
    ], { quando: { settimanaMin: 120 }, peso: 0.5, background: { nessuna: 0 }, porta: true }),
  e('amore_lontano', 'vita', 'A distanza',
    'La persona con cui stai si trasferisce per lavoro. Weekend in treno, o chiudere.',
    [
      o('treno', 'Il treno', { soldi: -200, tempo: -6, relazioni: +2, felicita: +1, ritardo: { settimane: 4, effetti: { soldi: -200 }, testo: 'I treni del weekend.' } }),
      o('chiudi', 'Chiudi', { relazioni: -6, felicita: -5 }),
    ], { quando: { relazioniMin: 50, settimanaMin: 70 }, peso: 0.6 }),
  e('volontariato_sabato', 'vita', 'Il sabato alla mensa',
    'Ti hanno chiesto una mano il sabato mattina.',
    [
      o('vai', 'Vai', { tempo: -3, felicita: +2, competenze: { empatia: +2 }, reputazione: +1 }),
      o('no', 'No', {}),
    ], { quando: { settimanaMin: 6 }, peso: 0.7 }),
  e('libro', 'vita', 'Un libro',
    'Uno di quelli che si finiscono in una notte e cambiano qualcosa.',
    [
      o('leggi', 'Lo leggi', { tempo: -2, competenze: { pensiero_critico: +2 }, felicita: +1, noia: -4 }),
      o('dopo', 'Dopo', {}),
    ], { peso: 0.6 }),
  e('macchina_nuova', 'vita', 'Una macchina',
    'Ti servirebbe. Usata, seimila euro; o continui in autobus.',
    [
      o('compri', 'La compri', { soldi: -6000, tempo: +5, felicita: +2 }, { richiede: { soldiMin: 7000 } }),
      o('no', 'Autobus', {}),
    ], { quando: { settimanaMin: 60, lavoro: true }, peso: 0.6, predefinita: 'no' }),
  e('festa_ufficio', 'vita', 'La festa aziendale',
    'Venerdì sera. Non hai voglia; ci va chi conta.',
    [
      o('vai', 'Vai', { tempo: -2, rete: +2, visibilita: +2, felicita: 0 }),
      o('no', 'No', { visibilita: -1, felicita: +1 }),
    ], { quando: { lavoro: 'vero' }, peso: 1, unaVolta: false }),
  e('vicino', 'vita', 'Il vicino',
    'Ha bisogno di una mano per un trasloco. Un sabato.',
    [
      o('aiuti', 'Aiuti', { tempo: -3, relazioni: +2, felicita: +1 }),
      o('no', 'No', { relazioni: -1 }),
    ], { peso: 0.5, unaVolta: false }),
];
