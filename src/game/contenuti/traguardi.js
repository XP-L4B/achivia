/**
 * I traguardi dell'arena: quarantasei, in quattro categorie.
 *
 * Sono un profilo a parte. Non toccano gli achievement di Achivia, i loro
 * contatori, le medaglie, i crediti: stanno nel deposito dell'arena
 * (`traguardiArena`) e si vedono dall'atrio. Sbloccarne uno non da'
 * niente che valga fuori dal gioco.
 *
 * Ogni traguardo si legge da una sola misura, `misura(m)`, contro una
 * soglia, `almeno`. `m` sono le misure della persona: i totali di tutte
 * le partite (uccisioni, boss, minuti, casse) e i primati di una partita
 * sola (la serie piu' lunga, il livello piu' alto, i minuti senza un
 * graffio). Cosi' ogni traguardo ha sempre un progresso vero, anche quelli
 * di sfida: "cinque minuti senza subire un colpo" mostra quanti minuti
 * puliti si sono fatti al massimo.
 *
 *   combattimento   uccisioni, boss, serie, critici
 *   progressione    partite, livelli, armi, evoluzioni, sinergie, casse, statistiche
 *   esplorazione    i minuti in arena, in una partita e in tutto
 *   sfida           una partita con una condizione addosso
 *
 * Le misure si aggiornano una volta sola, a fine partita, da
 * `aggiornaMisure(m, riassunto)`; `valuta(m, sbloccati)` da' la lista
 * completa con valore, progresso e stato.
 */

export const CATEGORIE = [
  { id: 'combattimento', nome: 'Combattimento' },
  { id: 'progressione', nome: 'Progressione' },
  { id: 'esplorazione', nome: 'Esplorazione' },
  { id: 'sfida', nome: 'Sfida' },
];


const T = (id, categoria, nome, descrizione, requisito, almeno, misura, unita = '') => ({ id, categoria, nome, descrizione, requisito, almeno, misura, unita });

export const TRAGUARDI = [
  /* ─── Combattimento ─── */
  T('primo-sangue', 'combattimento', 'Primo sangue', 'Le prime ossa a terra.', 'Elimina 1 nemico', 1, (m) => m.uccisioni, 'nemici'),
  T('cento', 'combattimento', 'Cento', 'Un centinaio, in tutto.', 'Elimina 100 nemici in totale', 100, (m) => m.uccisioni, 'nemici'),
  T('mille', 'combattimento', 'Mille', 'Le ondate cominciano a temerti.', 'Elimina 1.000 nemici in totale', 1000, (m) => m.uccisioni, 'nemici'),
  T('diecimila', 'combattimento', 'Diecimila', 'Nessuno li ha contati. Tu sì.', 'Elimina 10.000 nemici in totale', 10000, (m) => m.uccisioni, 'nemici'),
  T('strage', 'combattimento', 'Strage', 'Trecento in una partita sola.', 'Elimina 300 nemici in una partita', 300, (m) => m.record.uccisioni, 'nemici'),
  T('carneficina', 'combattimento', 'Carneficina', 'Ottocento, senza uscire.', 'Elimina 800 nemici in una partita', 800, (m) => m.record.uccisioni, 'nemici'),
  T('primo-boss', 'combattimento', 'Il primo boss', 'Ha una barra sua, e l’hai svuotata.', 'Abbatti 1 boss', 1, (m) => m.boss, 'boss'),
  T('cacciatore', 'combattimento', 'Cacciatore di boss', 'Dieci volte la barra rossa a zero.', 'Abbatti 10 boss in totale', 10, (m) => m.boss, 'boss'),
  T('tre-boss', 'combattimento', 'Tre in fila', 'Ettin, Occhio e Balor nella stessa partita.', 'Abbatti 3 boss in una partita', 3, (m) => m.record.boss, 'boss'),
  T('serie-25', 'combattimento', 'Serie', 'Venticinque senza farsi toccare.', 'Elimina 25 nemici di fila senza subire un colpo', 25, (m) => m.record.serie, 'di fila'),
  T('serie-100', 'combattimento', 'Serie lunga', 'Cento di fila, e nemmeno un graffio.', 'Elimina 100 nemici di fila senza subire un colpo', 100, (m) => m.record.serie, 'di fila'),
  T('critici', 'combattimento', 'Punto debole', 'Cento colpi dove fa più male.', 'Metti a segno 100 colpi critici in totale', 100, (m) => m.critici, 'critici'),
  T('boss-pulito', 'combattimento', 'Danza col boss', 'Un boss abbattuto senza subire un colpo da quando è entrato.', 'Abbatti 1 boss senza subire colpi durante lo scontro', 1, (m) => m.bossPuliti, 'boss'),
  /* ─── Progressione ─── */
  T('prima-partita', 'progressione', 'La prima', 'Sei entrato, e sei uscito.', 'Completa 1 partita', 1, (m) => m.partite, 'partite'),
  T('dieci-partite', 'progressione', 'Habitué', 'Dieci volte nell’arena.', 'Completa 10 partite', 10, (m) => m.partite, 'partite'),
  T('cinquanta-partite', 'progressione', 'Di casa', 'Cinquanta partite.', 'Completa 50 partite', 50, (m) => m.partite, 'partite'),
  T('livello-5', 'progressione', 'Livello 5', 'Le prime carte scelte.', 'Raggiungi il livello 5 in una partita', 5, (m) => m.record.livello, 'livello'),
  T('livello-10', 'progressione', 'Livello 10', 'Il mazzo comincia a prendere forma.', 'Raggiungi il livello 10 in una partita', 10, (m) => m.record.livello, 'livello'),
  T('livello-20', 'progressione', 'Livello 20', 'Una build vera.', 'Raggiungi il livello 20 in una partita', 20, (m) => m.record.livello, 'livello'),
  T('evoluzione', 'progressione', 'Evoluta', 'Un’arma al massimo, e oltre.', 'Evolvi 1 arma in una partita', 1, (m) => m.record.evoluzioni, 'evoluzioni'),
  T('arsenale', 'progressione', 'Arsenale', 'Quattro armi, tutte evolute.', 'Evolvi 4 armi nella stessa partita', 4, (m) => m.record.evoluzioni, 'evoluzioni'),
  T('sinergia', 'progressione', 'Sinergia', 'Un’arma e una statistica che si parlano.', 'Accendi 1 sinergia in una partita', 1, (m) => m.record.sinergie, 'sinergie'),
  T('tre-sinergie', 'progressione', 'Orchestra', 'Tre sinergie accese insieme.', 'Accendi 3 sinergie nella stessa partita', 3, (m) => m.record.sinergie, 'sinergie'),
  T('tutte-le-armi', 'progressione', 'Tutte le armi', 'Quattordici, provate almeno una volta.', 'Usa tutte le 14 armi, anche in partite diverse', 14, (m) => m.armi.length, 'armi'),
  T('tutti-i-personaggi', 'progressione', 'Tutti i personaggi', 'Sei classi, sei partite.', 'Gioca con tutti e 6 i personaggi', 6, (m) => m.personaggi.length, 'personaggi'),
  T('corazza', 'progressione', 'Corazza', 'Dieci punti di armatura addosso.', 'Finisci una partita con armatura 10 o più', 10, (m) => m.record.armatura, 'armatura'),
  T('grandine', 'progressione', 'Grandine', 'Tre proiettili in più su ogni arma.', 'Finisci una partita con 3 o più proiettili extra', 3, (m) => m.record.proiettili, 'proiettili'),
  T('danno-triplo', 'progressione', 'Tre volte', 'Il danno delle armi triplicato.', 'Finisci una partita con il danno a ×3 o più', 3, (m) => m.record.danno, '×'),
  T('casse-10', 'progressione', 'Apri e vedi', 'Dieci casse aperte.', 'Apri 10 casse in totale', 10, (m) => m.casse, 'casse'),
  T('casse-100', 'progressione', 'Collezionista', 'Cento casse aperte.', 'Apri 100 casse in totale', 100, (m) => m.casse, 'casse'),
  T('cassa-epica', 'progressione', 'Viola', 'Una cassa epica: lo schermo trema.', 'Apri 1 cassa epica', 1, (m) => m.casseEpiche, 'epiche'),
  T('cinque-epiche', 'progressione', 'Fortunato', 'Cinque casse epiche.', 'Apri 5 casse epiche in totale', 5, (m) => m.casseEpiche, 'epiche'),
  /* ─── Esplorazione ─── */
  T('un-minuto', 'esplorazione', 'Un minuto', 'Il primo minuto: le ossa, e basta.', 'Sopravvivi 1 minuto in una partita', 60, (m) => m.record.secondi, 's'),
  T('cinque-minuti', 'esplorazione', 'Cinque minuti', 'Il primo boss è arrivato e tu sei ancora lì.', 'Sopravvivi 5 minuti in una partita', 300, (m) => m.record.secondi, 's'),
  T('dieci-minuti', 'esplorazione', 'Dieci minuti', 'Tre boss, e le ondate piene.', 'Sopravvivi 10 minuti in una partita', 600, (m) => m.record.secondi, 's'),
  T('venti-minuti', 'esplorazione', 'Venti minuti', 'Il secondo giro dei boss.', 'Sopravvivi 20 minuti in una partita', 1200, (m) => m.record.secondi, 's'),
  T('mezzora', 'esplorazione', 'Mezz’ora', 'Trenta minuti in una partita sola.', 'Sopravvivi 30 minuti in una partita', 1800, (m) => m.record.secondi, 's'),
  T('un-ora', 'esplorazione', 'Un’ora in arena', 'Sessanta minuti, sommando le partite.', 'Gioca 60 minuti in totale', 3600, (m) => m.secondi, 's'),
  T('cinque-ore', 'esplorazione', 'Cinque ore', 'Trecento minuti di arena.', 'Gioca 5 ore in totale', 18000, (m) => m.secondi, 's'),
  T('dieci-ore', 'esplorazione', 'Veterano', 'Dieci ore.', 'Gioca 10 ore in totale', 36000, (m) => m.secondi, 's'),
  /* ─── Sfida ─── */
  T('intoccabile', 'sfida', 'Intoccabile', 'Cinque minuti senza subire un colpo.', 'Sopravvivi 5 minuti senza subire nessun colpo', 300, (m) => m.record.secondiPuliti, 's'),
  T('purista', 'sfida', 'Purista', 'Livello 10 con un’arma sola in mano.', 'Raggiungi il livello 10 senza prendere una seconda arma', 10, (m) => m.record.livelloUnArma, 'livello'),
  T('mani-nude', 'sfida', 'A mani nude', 'Tre minuti senza un modulo.', 'Sopravvivi 3 minuti senza scegliere nessun modulo', 180, (m) => m.record.secondiSenzaModuli, 's'),
  T('sprint', 'sfida', 'Sprint', 'Livello 5 prima dei due minuti.', 'Raggiungi il livello 5 entro i primi 2 minuti', 5, (m) => m.record.livelloA120, 'livello'),
  T('esploratore', 'sfida', 'Esploratore', 'Dieci casse nella stessa partita.', 'Apri 10 casse in una partita', 10, (m) => m.record.casse, 'casse'),
  T('furfante-lungo', 'sfida', 'Poca vita, molta strada', 'Quindici minuti con chi ha meno vita di tutti.', 'Sopravvivi 15 minuti con il Furfante', 900, (m) => m.record.secondiFurfante, 's'),
];

export const traguardoById = (id) => TRAGUARDI.find((t) => t.id === id) || null;

/** Le misure di chi non ha ancora giocato. */
export function misureVuote() {
  return {
    uccisioni: 0, boss: 0, critici: 0, partite: 0, secondi: 0, casse: 0, casseEpiche: 0, bossPuliti: 0,
    personaggi: [], armi: [],
    record: {
      uccisioni: 0, boss: 0, serie: 0, livello: 0, secondi: 0, evoluzioni: 0, sinergie: 0, armatura: 0, proiettili: 0, danno: 0, casse: 0,
      secondiPuliti: 0, livelloUnArma: 0, secondiSenzaModuli: 0, livelloA120: 0, secondiFurfante: 0,
    },
  };
}

const n = (v) => Math.max(0, Number(v) || 0);
const idArma = (voce) => String(voce).split(':')[0];

/**
 * Le misure dopo una partita: i totali sommano, i primati tengono il
 * massimo. Torna un oggetto nuovo; quello di prima non si tocca.
 *
 * Con `r.inCorso` la partita non e' finita: e' la fotografia di adesso,
 * per l'avviso a schermo. Vale tutto tranne il conto delle partite, che
 * si fa alla fine.
 */
export function aggiornaMisure(prima, r) {
  const m = { ...misureVuote(), ...(prima || {}), record: { ...misureVuote().record, ...(prima?.record || {}) } };
  if (!r) return m;
  const secondi = n(r.secondi); const armi = Array.isArray(r.armi) ? r.armi : [];
  const evoluzioni = armi.filter((a) => String(a).endsWith('+')).length;
  const moduliPresi = r.moduli ? Object.values(r.moduli).reduce((a, v) => a + n(v), 0) : 0;
  const st = r.statistiche || {};
  m.uccisioni += n(r.uccisioni);
  m.boss += n(r.boss);
  m.critici += n(r.critici);
  if (!r.inCorso) m.partite += 1;
  m.secondi += secondi;
  m.casse += n(r.casse);
  m.casseEpiche += n(r.casseEpiche);
  m.bossPuliti += n(r.bossPuliti);
  if (r.personaggio && !m.personaggi.includes(r.personaggio)) m.personaggi = [...m.personaggi, r.personaggio];
  const nuoveArmi = armi.map(idArma).filter((id) => !m.armi.includes(id));
  if (nuoveArmi.length) m.armi = [...m.armi, ...new Set(nuoveArmi)];
  const rec = m.record;
  rec.uccisioni = Math.max(rec.uccisioni, n(r.uccisioni));
  rec.boss = Math.max(rec.boss, n(r.boss));
  rec.serie = Math.max(rec.serie, n(r.serie));
  rec.livello = Math.max(rec.livello, n(r.livello));
  rec.secondi = Math.max(rec.secondi, secondi);
  rec.evoluzioni = Math.max(rec.evoluzioni, evoluzioni);
  rec.sinergie = Math.max(rec.sinergie, Array.isArray(r.sinergie) ? r.sinergie.length : 0);
  rec.armatura = Math.max(rec.armatura, n(st.armatura));
  rec.proiettili = Math.max(rec.proiettili, n(st.proiettiliExtra));
  rec.danno = Math.max(rec.danno, Math.round(n(st.danno) * 100) / 100);
  rec.casse = Math.max(rec.casse, n(r.casse));
  if (n(r.colpiSubiti) === 0) rec.secondiPuliti = Math.max(rec.secondiPuliti, secondi);
  if (armi.length <= 1) rec.livelloUnArma = Math.max(rec.livelloUnArma, n(r.livello));
  if (moduliPresi === 0) rec.secondiSenzaModuli = Math.max(rec.secondiSenzaModuli, secondi);
  rec.livelloA120 = Math.max(rec.livelloA120, n(r.livelloA120));
  if (r.personaggio === 'furfante') rec.secondiFurfante = Math.max(rec.secondiFurfante, secondi);
  return m;
}

/** Gli id che con queste misure risultano raggiunti (sbloccati o no che siano gia'). */
export const raggiunti = (m) => TRAGUARDI.filter((t) => t.misura(m) >= t.almeno).map((t) => t.id);

/**
 * La lista completa per la schermata: ogni traguardo con il valore di
 * adesso, il progresso (0..1), lo stato e la data di sblocco se c'e'.
 */
export function valuta(m, sbloccati = {}) {
  const misure = m || misureVuote();
  return TRAGUARDI.map((t) => {
    const valore = t.misura(misure);
    const quando = sbloccati[t.id] || null;
    return {
      id: t.id, categoria: t.categoria, nome: t.nome, descrizione: t.descrizione, requisito: t.requisito,
      almeno: t.almeno, unita: t.unita,
      valore: Math.min(valore, t.almeno),
      progresso: Math.max(0, Math.min(1, valore / t.almeno)),
      sbloccato: Boolean(quando) || valore >= t.almeno,
      quando,
    };
  });
}

/** Il valore e la soglia come si leggono: 3/10, 2:30/5:00. */
export function progressoLeggibile(v) {
  if (v.unita === 's') {
    const mm = (s) => `${Math.floor(s / 60)}:${String(Math.round(s) % 60).padStart(2, '0')}`;
    return `${mm(v.valore)} / ${mm(v.almeno)}`;
  }
  if (v.unita === '×') return `×${v.valore} / ×${v.almeno}`;
  return `${v.valore} / ${v.almeno}`;
}
