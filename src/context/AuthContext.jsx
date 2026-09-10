import { createContext, useContext, useState } from 'react';
import {
  getUserByEmail, getUserById, apriCanale, riponiCanale, mieOrganizzazioni, segnaAccesso,
} from '../data/db';

const SESSION_KEY = 'achivia_session';
// Il canale aperto sta in una chiave sua e non dentro la sessione: chi si
// e' fatto riconoscere e dove ha scelto di entrare sono due cose diverse, e
// la seconda cambia molte piu' volte della prima.
const ORG_KEY = 'achivia_org';

const AuthContext = createContext(null);

const leggi = (chiave) => {
  try { return localStorage.getItem(chiave); } catch { return null; }
};
const scrivi = (chiave, valore) => {
  try {
    if (valore) localStorage.setItem(chiave, valore);
    else localStorage.removeItem(chiave);
  } catch { /* noop */ }
};

/**
 * Chi sta usando l'app, e da quale organizzazione.
 *
 * Le organizzazioni sono canali: si fa l'accesso una volta e poi si sceglie
 * in quale entrare, come si sceglie una stanza dopo essere entrati in casa.
 * Una persona puo' farne parte di piu' d'una, con ruoli diversi — dipendente
 * di la', allenatore di qua — e il canale aperto decide che cosa vede: la
 * barra, le schermate, i permessi.
 *
 * `user` e' la persona come si presenta nel canale aperto adesso. Non e' una
 * semplificazione: e' la risposta alla domanda che tutte le schermate fanno
 * davvero, cioe' "dove sono e che cosa posso fare qui".
 */
export function AuthProvider({ children }) {
  /* Nessun canale aperto: la persona resta se stessa, senza il ruolo e il
     reparto di un'organizzazione addosso. */
  function svuota(persona) {
    scrivi(ORG_KEY, null);
    return apriCanale(persona.id, null) || persona;
  }

  const [user, setUser] = useState(() => {
    const id = leggi(SESSION_KEY);
    if (!id) return null;
    const persona = getUserById(id);
    if (!persona) return null;
    const orgId = leggi(ORG_KEY);
    // Il canale si riapre com'era: chi ricarica la pagina si ritrova dove
    // stava, non davanti all'elenco. Se nel frattempo e' uscito da
    // quell'organizzazione, l'elenco e' esattamente dove deve tornare.
    if (orgId) return apriCanale(id, orgId) || svuota(persona);
    return svuota(persona);
  });

  function login(email, password) {
    const found = getUserByEmail(email);
    if (!found || found.password !== password) {
      return { ok: false, error: 'Email o password non corretti.' };
    }
    scrivi(SESSION_KEY, found.id);
    // Quando si e' fatto vedere l'ultima volta. Serve a una domanda sola —
    // quante persone usano davvero l'applicazione — e non c'e' nessun altro
    // posto in cui la risposta si possa raccogliere.
    segnaAccesso(found.id);
    // Dopo l'accesso non si entra da nessuna parte: si sceglie. Anche chi ha
    // una sola organizzazione passa dall'elenco, perche' e' anche il posto
    // da cui se ne crea una nuova o si entra in un'altra con il codice.
    scrivi(ORG_KEY, null);
    const pulito = apriCanale(found.id, null) || found;
    setUser(pulito);
    return { ok: true, user: pulito };
  }

  /**
   * Apre un canale e torna la persona come si presenta li' dentro, cosi'
   * chi ha chiamato sa subito in quale area mandarla: lo stesso account
   * entra da amministratore in un'organizzazione e da membro in un'altra.
   * `null` se quella non e' un'organizzazione sua.
   */
  function entraInOrg(orgId) {
    /* Chi sta entrando si rilegge dalla sessione e non dallo stato: chi si
       registra fa l'accesso e apre il canale nello stesso gesto, e in quel
       momento lo stato porta ancora il valore di prima dell'accesso. */
    const chi = user?.id || leggi(SESSION_KEY);
    if (!chi) return null;
    const dentro = apriCanale(chi, orgId);
    if (!dentro) return null;
    scrivi(ORG_KEY, orgId);
    const proiettata = { ...dentro };
    setUser(proiettata);
    return proiettata;
  }

  function logout() {
    if (user) {
      const persona = getUserById(user.id);
      // Quello che si e' fatto nel canale aperto torna nella sua riga prima
      // di chiudere: senza, l'ultima modifica della sessione si perderebbe.
      if (persona) riponiCanale(persona);
    }
    scrivi(SESSION_KEY, null);
    scrivi(ORG_KEY, null);
    setUser(null);
  }

  /** Le organizzazioni di chi sta guardando. Solo le sue, mai di altri. */
  const leMie = () => (user ? mieOrganizzazioni(user.id) : []);

  return (
    <AuthContext.Provider value={{ user, login, logout, entraInOrg, leMie }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext);
}
