/**
 * I traguardi dell'organizzazione: le medaglie che vince chi l'azienda la
 * guida — l'admin e i co-admin — e nessun altro.
 *
 * ── Due forme, non una ──────────────────────────────────────────────────
 *
 * A livelli (`livelli: [a, b, c, d]`): una scala che si sale una volta
 * sola, nei quattro metalli di sempre — bronzo, argento, oro, diamante. E'
 * la forma di quello che cresce e non torna indietro: quanta gente c'e',
 * quante competenze si sono riconosciute, quanti anni ha l'azienda.
 *
 * Ripetibili (`target` + `ripetibile: true`): una medaglia sola, che si
 * riprende ogni volta che il traguardo si raggiunge di nuovo — la seconda
 * volta non cancella la prima, come per gli achievement delle persone. E'
 * la forma di quello che ritorna: un altro blocco di consegne puntuali, un
 * altro trimestre in crescita, un altro mese senza assenze.
 *
 * ── Non si toccano ──────────────────────────────────────────────────────
 *
 * Nessuna schermata li modifica: non i nomi, non le soglie, non le
 * ricompense — che sono zero per tutti, di proposito. L'admin e' quello che
 * i crediti li distribuisce; farglieli guadagnare da se' sarebbe un
 * conflitto d'interessi scritto nel codice. Cambiare qualcosa qui vuol dire
 * cambiare questo file.
 *
 * Le medaglie sono le famiglie gia' in `src/assets/skills/custom/`: quelle
 * a livelli prendono il metallo del livello raggiunto, quelle ripetibili
 * l'oro — sono medaglie che non salgono di grado, e il diamante resta il
 * gradino piu' alto di chi una scala ce l'ha.
 */

import { badgePerNome } from './skillBadges';

export const NOMI_LIVELLO = ['Bronzo', 'Argento', 'Oro', 'Diamante'];

/** Il metallo con cui si mostra una medaglia ripetibile: l'oro. */
const METALLO_RIPETIBILE = 3;

const scala = (id, nome, descrizione, gruppo, metrica, livelli, famiglia, unita, extra = {}) => ({
  id, nome, descrizione, gruppo, metrica, livelli, famiglia, unita, ripetibile: false, ...extra,
});

const ripetibile = (id, nome, descrizione, gruppo, metrica, target, famiglia, unita, extra = {}) => ({
  id, nome, descrizione, gruppo, metrica, target, famiglia, unita, ripetibile: true, ...extra,
});

export const TRAGUARDI_ORG = [
  /* ─── Quest e lavoro ─────────────────────────────────────────────────*/
  scala('org-motore', 'Motore acceso',
    'Quest messe in circolo nell’organizzazione, dalla prima all’ultima.',
    'Quest', 'quest_assegnate', [100, 500, 2000, 10000], 'custom-42', 'quest'),

  scala('org-consegne', 'Portate a casa',
    'Quest completate e approvate in tutta l’organizzazione.',
    'Quest', 'quest_completate', [50, 250, 1000, 5000], 'custom-36', 'quest'),

  ripetibile('org-puntuali', 'Consegne puntuali',
    'Cento quest consegnate entro la scadenza.',
    'Quest', 'quest_in_tempo', 100, 'custom-35', 'quest in tempo'),

  scala('org-puntualita', 'Puntualità',
    'La percentuale di quest completate che è arrivata entro la scadenza. Si misura da cinquanta quest in poi: sotto, una percentuale racconta il caso.',
    'Quest', 'puntualita', [70, 80, 90, 95], 'custom-34', '%'),

  ripetibile('org-mai-scaduta', 'Niente di scaduto',
    'Novanta giorni di fila senza che una quest scada.',
    'Quest', 'giorni_senza_scadute', 90, 'custom-11', 'giorni', { serie: true }),

  scala('org-insieme', 'Squadra sul campo',
    'Quest di gruppo e istanze portate a termine.',
    'Quest', 'quest_gruppo', [10, 50, 200, 1000], 'custom-26', 'quest di gruppo'),

  ripetibile('org-side', 'Oltre il compito',
    'Venticinque side quest prese e completate.',
    'Quest', 'quest_side', 25, 'custom-39', 'side quest'),

  ripetibile('org-scrivania', 'Scrivania pulita',
    'Cento quest approvate entro quarantotto ore dalla consegna: il lavoro fatto non resta in attesa.',
    'Quest', 'approvazioni_rapide', 100, 'custom-41', 'approvazioni'),

  scala('org-ritmo', 'Ritmo',
    'Settimane di fila con almeno una quest chiusa: non quanto si è fatto, ma senza mai fermarsi.',
    'Quest', 'settimane_di_fila', [4, 12, 26, 52], 'custom-18', 'settimane'),

  ripetibile('org-trimestre', 'Trimestre in crescita',
    'Un trimestre chiuso con più quest completate di quello prima.',
    'Quest', 'trimestri_in_crescita', 1, 'custom-04', 'trimestri'),

  ripetibile('org-filotto', 'Filotto',
    'Cento quest chiuse di fila senza una consegna in ritardo e senza lasciarne scadere una.',
    'Quest', 'quest_senza_ritardi', 100, 'custom-13', 'quest', { serie: true }),

  /* ─── Competenze ─────────────────────────────────────────────────────*/
  scala('org-maestri', 'Maestri',
    'Competenze certificate alle persone dell’organizzazione.',
    'Competenze', 'certificazioni', [10, 50, 200, 1000], 'custom-19', 'certificazioni'),

  scala('org-ampiezza', 'Ampiezza',
    'Competenze diverse riconosciute almeno una volta: quanto è largo il sapere che gira in azienda.',
    'Competenze', 'competenze_coperte', [5, 15, 30, 50], 'custom-02', 'competenze'),

  scala('org-catalogo', 'Catalogo proprio',
    'Competenze create dall’organizzazione, oltre a quelle standard.',
    'Competenze', 'competenze_proprie', [3, 10, 25, 50], 'custom-12', 'competenze'),

  scala('org-maestria', 'Maestria',
    'Certificazioni al livello più alto: persone che sul loro mestiere sono un riferimento.',
    'Competenze', 'certificazioni_esperto', [1, 5, 15, 40], 'custom-03', 'certificazioni Expert'),

  /* ─── Collaborazione ─────────────────────────────────────────────────*/
  ripetibile('org-aiuti', 'Nessuno da solo',
    'Venticinque richieste d’aiuto raccolte da un collega.',
    'Collaborazione', 'aiuti_risolti', 25, 'custom-47', 'aiuti'),

  scala('org-aiutanti', 'Si aiuta in tanti',
    'Persone diverse che almeno una volta hanno risposto a una richiesta d’aiuto.',
    'Collaborazione', 'aiutanti_diversi', [3, 10, 25, 50], 'custom-33', 'persone'),

  ripetibile('org-aiuto-lampo', 'Aiuto lampo',
    'Venticinque richieste d’aiuto raccolte entro ventiquattro ore.',
    'Collaborazione', 'aiuti_rapidi', 25, 'custom-31', 'aiuti'),

  scala('org-squadre', 'Squadre',
    'Team veri messi in piedi dentro l’organizzazione.',
    'Collaborazione', 'team', [2, 5, 15, 30], 'custom-06', 'team'),

  ripetibile('org-extra-mile', 'Extra Mile',
    'Venticinque volte in cui qualcuno ha fatto ben oltre quanto la quest chiedeva, e se l’è visto riconoscere.',
    'Collaborazione', 'extra_mile', 25, 'custom-21', 'assegnazioni'),

  /* ─── Persone ────────────────────────────────────────────────────────*/
  scala('org-crescita', 'Si cresce',
    'Persone nell’organizzazione.',
    'Persone', 'membri', [5, 25, 100, 500], 'custom-32', 'persone'),

  ripetibile('org-review', 'Si parla',
    'Venticinque performance review scritte: il lavoro si guarda insieme, non si indovina.',
    'Persone', 'review', 25, 'custom-29', 'review'),

  ripetibile('org-riconoscere', 'Riconoscere',
    'Cento medaglie consegnate alle persone dell’organizzazione.',
    'Persone', 'medaglie', 100, 'custom-25', 'medaglie'),

  scala('org-anzianita', 'Si va avanti',
    'Da quanto tempo l’organizzazione esiste: un mese, sei mesi, un anno, tre anni.',
    'Persone', 'anzianita', [30, 180, 365, 1095], 'custom-20', 'giorni'),

  /* ─── Presenze ───────────────────────────────────────────────────────*/
  ripetibile('org-presenti', 'Nessuno manca',
    'Novanta giorni di fila senza un’assenza registrata, da nessuno.',
    'Presenze', 'giorni_senza_assenze', 90, 'custom-30', 'giorni', { serie: true }),

  ripetibile('org-orario', 'Tutti in orario',
    'Quarantacinque giorni di fila senza un ritardo in ingresso.',
    'Presenze', 'giorni_senza_ritardi', 45, 'custom-16', 'giorni', { serie: true }),

  scala('org-serie', 'Serie lunghe',
    'Persone con una Presence Streak da Silver in su: novanta giorni di fila senza assenze, ciascuna.',
    'Presenze', 'persone_serie_lunga', [1, 5, 15, 40], 'custom-27', 'persone'),

  ripetibile('org-mese-pulito', 'Mese pulito',
    'Un mese intero chiuso senza nessuna assenza in tutta l’organizzazione.',
    'Presenze', 'mesi_puliti', 1, 'custom-09', 'mesi'),

  /* ─── Economia interna ───────────────────────────────────────────────*/
  scala('org-zecca', 'La zecca',
    'Crediti distribuiti alle persone, fra quest approvate e ricompense.',
    'Economia', 'crediti_distribuiti', [1000, 10000, 50000, 250000], 'custom-38', 'crediti'),

  ripetibile('org-mercato', 'Il negozio gira',
    'Cinquemila crediti spesi nel negozio: un’economia interna serve se i crediti tornano indietro.',
    'Economia', 'crediti_spesi', 5000, 'custom-43', 'crediti'),
];

export const GRUPPI_ORG = [...new Set(TRAGUARDI_ORG.map((t) => t.gruppo))];

export const traguardoOrgById = (id) => TRAGUARDI_ORG.find((t) => t.id === id) || null;

/**
 * L'immagine di un traguardo. Le scale prendono il metallo del livello
 * raggiunto — e quello del primo gradino finche' non si e' preso niente,
 * cosi' si vede che cosa si sta per conquistare; le ripetibili prendono
 * sempre l'oro.
 */
export function badgeTraguardo(def, livello = 0) {
  if (!def?.famiglia) return null;
  const metallo = def.ripetibile
    ? METALLO_RIPETIBILE
    : Math.min(4, Math.max(1, livello || 1));
  return badgePerNome(`${def.famiglia}-${metallo}`);
}

/** La definizione con l'immagine giusta addosso: e' quella che va ai componenti. */
export const conMedaglia = (def, livello = 0) => ({
  ...def,
  badgeImage: badgeTraguardo(def, livello),
});
