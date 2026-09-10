/**
 * Le azioni dell'assistente.
 *
 * Sta in un file suo e non accanto al pannello perche' non e' un
 * componente: mescolarlo agli altri export rompe il ricaricamento a caldo.
 *
 * Non e' una scorciatoia a un campo libero — il campo libero non c'e' piu'.
 * Una domanda scritta a mano su una persona e' una domanda di cui nessuno
 * sa il testo, e questo strumento legge i dati di qualcuno: le domande
 * devono essere quelle che l'applicazione ha deciso di saper fare, sempre
 * le stesse, sempre leggibili da chi le riceve. Ognuna costa un'azione, e
 * il tetto e' del piano.
 */
export const AZIONI = [
  { id: 'perf', label: 'Performance\ngenerale', q: 'Com’è la performance generale?' },
  { id: 'cresc', label: 'Sviluppo\ndel profilo', q: 'Su cosa dovrebbe crescere?' },
];
