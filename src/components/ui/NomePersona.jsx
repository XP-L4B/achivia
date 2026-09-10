/**
 * Come si presenta una persona in Achivia.
 *
 * Grande c'e' il nome che ha scelto — il nickname, se se n'e' dato uno —
 * e sotto, piccolo, quello vero: chi si fa chiamare "Ombra" resta comunque
 * Marco Verdi, e in un'app dove si assegna lavoro e si registrano assenze
 * il nome vero non puo' sparire dietro un soprannome.
 *
 * Accanto al nome vero c'e' il numero Achivia. Nomi e nickname si ripetono —
 * di Mario Rossi ce n'e' più d'uno, e due persone possono scegliere lo
 * stesso nickname lo stesso giorno — il numero no: e' l'unica cosa che
 * identifica un account senza ambiguita', ed e' visibile a tutti proprio
 * perche' serva a questo.
 *
 * Tutto questo pero' vale in azienda. In un'organizzazione personalizzata
 * — una famiglia, una squadra, una classe — il nome e il cognome non si
 * vedono: restano il nickname e il numero. Il motivo e' che quel tipo di
 * organizzazione se la crea chiunque in trenta secondi, e chi ci entra con
 * un codice non ha firmato niente con nessuno: nome e cognome veri di una
 * persona in un gruppo di sconosciuti sono un dato che nessuno ha chiesto
 * di dare. In azienda invece il rapporto c'e', e sapere chi c'e'
 * dall'altra parte non e' un dettaglio estetico.
 *
 * La propria fa eccezione: il proprio nome lo si vede sempre, in
 * qualunque organizzazione. Nasconderlo a se' stessi non protegge nessuno.
 */

import { codiceVisibile } from '../../data/identita';
import { useAuth } from '../../context/AuthContext';
import { orgPersonalizzata } from '../../data/db';

export default function NomePersona({ persona, grande = false, mostraNumero = true, className = '' }) {
  /* Il contesto puo' mancare — una schermata montata da sola, un'anteprima
     — e in quel caso non si nasconde niente: la regola vale dentro un
     gruppo, e senza contesto non si e' dentro nessun gruppo. */
  const chiGuarda = useAuth()?.user ?? null;

  if (!persona) return null;

  const inUnGruppo = Boolean(chiGuarda?.orgId) && orgPersonalizzata(chiGuarda.orgId);
  const suo = chiGuarda?.id === persona.id;
  const nascondiIlNome = inUnGruppo && !suo;

  const alias = persona.nickname?.trim();
  const numero = codiceVisibile(persona);

  /* Senza nickname il nome vero e' gia' quello grande: ripeterlo sotto
     sarebbe un'eco. Resta il numero, che e' l'altra meta' dell'identita'.
     In un gruppo, chi non si e' dato un nickname si presenta col numero:
     e' l'unica cosa che ha, ed e' anche quella che serve — per dire di chi
     si sta parlando basta e avanza. */
  const sopra = nascondiIlNome ? (alias || numero) : (alias || persona.name);
  const sotto = [
    nascondiIlNome ? null : (alias ? persona.name : null),
    mostraNumero && sopra !== numero ? numero : null,
  ].filter(Boolean).join(' · ');

  return (
    <span className={`nome-persona${grande ? ' is-grande' : ''}${className ? ` ${className}` : ''}`}>
      <span className="nome-alias">{sopra}</span>
      {sotto && <small className="nome-vero">{sotto}</small>}
    </span>
  );
}
