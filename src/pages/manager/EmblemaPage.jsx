import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageShell from '../../components/ui/PageShell';
import BackTile from '../../components/ui/BackTile';
import Chips from '../../components/ui/Chips';
import Emblema, { StemmaDisegnato } from '../../components/ui/Emblema';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { useAuth } from '../../context/AuthContext';
import { getUserById, nomeOrgDi } from '../../data/db';
import {
  FORME, SFONDI, ACCENTI, SIMBOLI, STEMMA_PREDEFINITO,
  emblemaDi, puoCambiareEmblema, caricaLogo, salvaStemma, rimuoviEmblema,
} from '../../data/emblema';

const MODI = [
  { id: 'stemma', label: 'Disegna uno stemma' },
  { id: 'logo',   label: 'Carica un logo' },
];

/**
 * L'insegna dell'organizzazione, dalla parte di chi la mette.
 *
 * Un'azienda il logo ce l'ha gia': lo carica e finisce li'. Chi non ce l'ha
 * — una famiglia, una squadra — se lo compone: forma, colori, simbolo, e
 * l'anteprima cambia mentre si sceglie, alla misura vera in cui l'insegna
 * si vedra' (piccola nella barra, grande nel profilo).
 */
export default function EmblemaPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const me = getUserById(user.id) || user;
  const orgId = me.orgId;

  const attuale = emblemaDi(orgId);
  const [modo, setModo] = useState(attuale?.tipo === 'logo' ? 'logo' : 'stemma');
  const [stemma, setStemma] = useState(attuale?.stemma || STEMMA_PREDEFINITO);
  const [errore, setErrore] = useState('');
  const [esito, setEsito] = useState('');
  const [daTogliere, setDaTogliere] = useState(false);
  const [, setVersione] = useState(0);
  const fileRef = useRef(null);

  if (!puoCambiareEmblema(me, orgId)) {
    return (
      <>
        <PageShell
          title="Insegna dell’organizzazione"
          description="La mette chi guida l’organizzazione: l’amministratore e i co-amministratori."
        />
        <BackTile />
      </>
    );
  }

  const cambia = (campo) => (valore) => {
    setStemma((s) => ({ ...s, [campo]: valore }));
    setEsito('');
  };

  function salva() {
    const fatto = salvaStemma(me, orgId, stemma);
    if (!fatto) { setErrore('Non sono riuscito a salvare lo stemma.'); return; }
    setErrore('');
    setEsito('Stemma salvato: lo trovi accanto al marchio, in alto.');
    setVersione((v) => v + 1);
  }

  async function scegliFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrore('');
    setEsito('');
    const risultato = await caricaLogo(me, orgId, file);
    if (fileRef.current) fileRef.current.value = '';
    if (!risultato.ok) { setErrore(risultato.errore); return; }
    setEsito('Logo caricato: lo trovi accanto al marchio, in alto.');
    setVersione((v) => v + 1);
  }

  function togli() {
    rimuoviEmblema(me, orgId);
    setDaTogliere(false);
    setEsito('Insegna rimossa.');
    setVersione((v) => v + 1);
  }

  return (
    <>
      <PageShell
        title="Insegna dell’organizzazione"
        description="Il logo della tua azienda, oppure uno stemma che la rappresenti. Compare accanto al marchio in ogni schermata di chi ne fa parte."
      />

      <div className="ui-corpo-pagina">
        {/* L'insegna alle due misure in cui si vedra' davvero. */}
        <section className="px-panel emblema-anteprima">
          <div className="emblema-grande">
            {modo === 'stemma'
              ? <StemmaDisegnato stemma={stemma} nomeOrg={nomeOrgDi(me.orgId)} size={120} titolo="Anteprima dello stemma" />
              : (emblemaDi(orgId)
                  ? <Emblema orgId={orgId} nomeOrg={nomeOrgDi(me.orgId)} size={120} titolo="Logo dell’organizzazione" />
                  : <p className="tv-vuoto">Nessun logo caricato.</p>)}
          </div>
          <div className="emblema-piccolo">
            <span className="ui-wordmark">ACHIVIA</span>
            {modo === 'stemma'
              ? <StemmaDisegnato stemma={stemma} nomeOrg={nomeOrgDi(me.orgId)} size={26} />
              : <Emblema orgId={orgId} nomeOrg={nomeOrgDi(me.orgId)} size={26} />}
            <small>come si vedrà in alto</small>
          </div>
        </section>

        <Chips items={MODI} value={modo} onChange={setModo} ariaLabel="Come fare l’insegna" />

        {modo === 'stemma' ? (
          <>
            <fieldset className="ruolo-gruppo">
              <legend>Forma</legend>
              <div className="emblema-scelte">
                {FORME.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    className={`emblema-scelta${stemma.forma === f.id ? ' is-scelta' : ''}`}
                    onClick={() => cambia('forma')(f.id)}
                    aria-pressed={stemma.forma === f.id}
                  >
                    <StemmaDisegnato stemma={{ ...stemma, forma: f.id }} nomeOrg={nomeOrgDi(me.orgId)} size={44} />
                    <span>{f.nome}</span>
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset className="ruolo-gruppo">
              <legend>Fondo</legend>
              <div className="emblema-colori">
                {SFONDI.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className={`emblema-colore${stemma.sfondo === c.id ? ' is-scelta' : ''}`}
                    style={{ background: c.colore }}
                    onClick={() => cambia('sfondo')(c.id)}
                    aria-pressed={stemma.sfondo === c.id}
                    aria-label={c.nome}
                    title={c.nome}
                  />
                ))}
              </div>
            </fieldset>

            <fieldset className="ruolo-gruppo">
              <legend>Accento</legend>
              <div className="emblema-colori">
                {ACCENTI.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className={`emblema-colore${stemma.accento === c.id ? ' is-scelta' : ''}`}
                    style={{ background: c.colore }}
                    onClick={() => cambia('accento')(c.id)}
                    aria-pressed={stemma.accento === c.id}
                    aria-label={c.nome}
                    title={c.nome}
                  />
                ))}
              </div>
            </fieldset>

            <fieldset className="ruolo-gruppo">
              <legend>Simbolo</legend>
              <div className="emblema-scelte">
                {SIMBOLI.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className={`emblema-scelta${stemma.simbolo === s.id ? ' is-scelta' : ''}`}
                    onClick={() => cambia('simbolo')(s.id)}
                    aria-pressed={stemma.simbolo === s.id}
                  >
                    <StemmaDisegnato stemma={{ ...stemma, simbolo: s.id }} nomeOrg={nomeOrgDi(me.orgId)} size={44} />
                    <span>{s.nome}</span>
                  </button>
                ))}
              </div>
            </fieldset>

            <button type="button" className="px-btn block" onClick={salva}>Salva lo stemma</button>
          </>
        ) : (
          <section className="ui-blocco tv-modulo">
            <label className="label">
              Immagine del logo
              <input ref={fileRef} type="file" accept="image/*" onChange={scegliFile} />
            </label>
            <p className="ui-dialog-hint">
              L’immagine viene rimpicciolita qui nel browser prima di essere salvata:
              un logo quadrato, con il fondo trasparente, è quello che viene meglio.
            </p>
          </section>
        )}

        {errore && <p className="ui-errore" role="alert">{errore}</p>}
        {esito && <p className="ui-esito" role="status">{esito}</p>}

        {emblemaDi(orgId) && (
          <button type="button" className="px-btn ghost" onClick={() => setDaTogliere(true)}>
            Togli l’insegna
          </button>
        )}

        <button type="button" className="px-btn ghost" onClick={() => navigate(-1)}>Torna al profilo</button>
      </div>

      {daTogliere && (
        <ConfirmDialog
          titolo="Togliere l’insegna?"
          testo="L’organizzazione resta senza logo e senza stemma. Puoi rimetterne una quando vuoi."
          conferma="Togli"
          distruttiva
          onConferma={togli}
          onChiudi={() => setDaTogliere(false)}
        />
      )}

      <BackTile />
    </>
  );
}
