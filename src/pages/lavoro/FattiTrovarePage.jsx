import { useState } from 'react';
import PageShell from '../../components/ui/PageShell';
import Button from '../../components/ui/Button';
import Chips from '../../components/ui/Chips';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import TerminalPanel from '../../components/terminal/TerminalPanel';
import { useAuth } from '../../context/AuthContext';
import {
  getUserById, fattiTrovare, revocaTrovabilita, togliPosizione,
  puoCercareLavoro, puoFarsiTrovare, nomeOrgDi, orgDiPersona, orgPersonalizzata,
} from '../../data/db';
import {
  CONTINENTI, LINGUE, paesiDi, areeDi, nomeZona, nomeLivelloArea,
} from '../../data/geografia';
import { chiediPosizione, PASSO_GRIGLIA_KM } from '../../data/posizione';
import { DISPONIBILITA, CONTRATTI, ORARI, MODI_REMOTO } from '../../data/talenti';

/* Il nome dell'azienda che tiene fuori dall'elenco. Non e' per forza quella
   del canale aperto: chi lavora da qualche parte lavora anche mentre sta
   guardando il gruppo di calcetto. */
const nomeAzienda = (me) => {
  const sua = orgDiPersona(me?.id).find((m) => !orgPersonalizzata(m.orgId));
  return sua ? nomeOrgDi(sua.orgId) : '';
};

/**
 * Farsi trovare.
 *
 * Tre cose da dire — chi sei in poche righe, dove sei disposto ad andare,
 * che lingue parli — e una da accettare.
 *
 * I termini non sono una casella da spuntare in fondo: sono la sola ragione
 * per cui questi dati escono dal profilo, e per questo si leggono per
 * intero prima e non si possono saltare. Si revocano da qui, in un clic, e
 * la revoca non nasconde il profilo: lo toglie. Un consenso che si da' e non
 * si puo' riprendere non e' un consenso.
 *
 * La cover letter e' l'unica cosa scritta a mano che finisce sotto gli occhi
 * di chi cerca: tutto il resto sono fatti che l'applicazione ha gia'. Percio'
 * il campo e' grande e non c'e' scritto "opzionale".
 */
const MAX_LETTERA = 800;

/* Tre domande al posto del foglio bianco.
   Un riquadro vuoto con un suggerimento in grigio e' il punto in cui la
   maggior parte delle persone chiude la pagina: non perche' non abbiano
   niente da dire, ma perche' non sanno da dove cominciare. Tre domande
   corte danno un attacco, e chi vuole scrivere di suo trova il testo gia'
   li' da riscrivere. Il campo libero resta: la guida lo riempie, non lo
   sostituisce. */
const DOMANDE = [
  { id: 'fai', etichetta: 'Che cosa sai fare meglio', esempio: 'coordinare turni in magazzino' },
  { id: 'vuoi', etichetta: 'Che cosa vorresti imparare', esempio: 'analisi dei dati' },
  { id: 'cerchi', etichetta: 'Che cosa cerchi adesso', esempio: 'un posto piccolo dove decidere' },
];

const componi = (r) => [
  r.fai?.trim() && `Quello che so fare meglio: ${r.fai.trim()}.`,
  r.vuoi?.trim() && `Vorrei imparare: ${r.vuoi.trim()}.`,
  r.cerchi?.trim() && `Cerco: ${r.cerchi.trim()}.`,
].filter(Boolean).join(' ');

export default function FattiTrovarePage() {
  const { user } = useAuth();
  const me = getUserById(user?.id) || user;
  const gia = me?.trovabilita;

  const [lettera, setLettera] = useState(gia?.lettera || '');
  const [zone, setZone] = useState(gia?.zone?.length ? gia.zone : []);
  const [lingue, setLingue] = useState(gia?.lingue || []);
  const [accetta, setAccetta] = useState(Boolean(gia?.attiva));
  const [bozza, setBozza] = useState({ continente: '', paese: '', area: '' });
  const [posizione, setPosizione] = useState(gia?.posizione || null);
  const [cerca, setCerca] = useState(gia?.cerca || {
    mestiere: '', disponibilita: '', contratto: '', orario: '', remoto: '',
  });
  const [esitoGeo, setEsitoGeo] = useState('');
  const [salvato, setSalvato] = useState(false);
  const [revoca, setRevoca] = useState(false);
  const [risposte, setRisposte] = useState({ fai: '', vuoi: '', cerchi: '' });

  if (!puoCercareLavoro(me)) {
    return <PageShell title="Fatti trovare" description="Non disponibile per questo tipo di accesso." />;
  }

  /* Dentro un'azienda non ci si mette in elenco. Non e' un divieto scritto
     solo qui: `fattiTrovare` rifiuta comunque, e questa schermata spiega
     perche' invece di mostrare un modulo che al momento di salvare non
     salva. Un gruppo o una famiglia non chiudono questa porta: chi sta li'
     dentro cerca lavoro come chiunque altro. */
  if (!puoFarsiTrovare(me)) {
    const org = nomeAzienda(me) || 'l’azienda in cui lavori';
    const sospeso = me.trovabilita?.sospesoPerOrg;
    return (
      <div className="page">
        <PageShell
          title="Fatti trovare"
          description="Si può stare in elenco solo da liberi."
        />
        <div className="ui-corpo-pagina">
          <TerminalPanel titolo="NON DA DENTRO UN’AZIENDA" className="ui-blocco con-stacco">
            <p className="tv-vuoto">
              Finché lavori in {org} il tuo profilo non entra nell’elenco che vedono le
              aziende in cerca di persone, e l’interruttore non si può accendere. Un gruppo o
              una famiglia non contano: quello non è un lavoro.
            </p>
            <p className="ui-dialog-hint">
              Non è una limitazione tecnica: è che comparire mentre si ha un lavoro vorrebbe dire
              che chiunque abbia accesso a quella ricerca può sapere che ti stai guardando intorno.
              Nessuno accenderebbe più quell’interruttore, e l’elenco resterebbe vuoto.
            </p>
            {sospeso && (
              <p className="ui-dialog-hint">
                Eri in elenco prima di entrare qui: <b>quello che avevi scritto è tutto al suo
                posto</b>, non è stato cancellato niente. Il giorno in cui lascerai
                l’organizzazione potrai rimetterti in elenco in un clic.
              </p>
            )}
            <Button variante="fantasma" compatto to="/i-miei-dati">Guarda i tuoi dati</Button>
          </TerminalPanel>
        </div>
      </div>
    );
  }

  const attiva = Boolean(gia?.attiva);
  const puoSalvare = accetta && lettera.trim().length > 0 && zone.length > 0;

  function aggiungiZona() {
    if (!bozza.continente) return;
    const uguale = zone.some((z) => z.continente === bozza.continente
      && (z.paese || '') === (bozza.paese || '') && (z.area || '') === (bozza.area || ''));
    if (!uguale) setZone([...zone, { ...bozza }]);
    setBozza({ continente: '', paese: '', area: '' });
  }

  async function prendiPosizione() {
    setEsitoGeo('attesa');
    const esito = await chiediPosizione();
    if (esito.ok) {
      setPosizione(esito.posizione);
      setEsitoGeo('presa');
    } else {
      setPosizione(null);
      setEsitoGeo(esito.motivo);
    }
  }

  function salva() {
    fattiTrovare(me.id, { lettera, zone, lingue, accettato: accetta, posizione, cerca });
    setSalvato(true);
  }

  function scordaPosizione() {
    togliPosizione(me.id);
    setPosizione(null);
    setEsitoGeo('');
  }

  function togli() {
    revocaTrovabilita(me.id);
    setRevoca(false);
    setSalvato(false);
    setAccetta(false);
  }

  return (
    <div className="page">
      <PageShell
        title="Fatti trovare"
        description="Il tuo profilo entra in un elenco che vedono solo le organizzazioni abilitate da Achivia a cercare persone."
      />

      <div className="ui-corpo-pagina">
        <TerminalPanel
          titolo="COSA VEDONO DI TE"
          meta={attiva ? 'IN ELENCO' : 'NON IN ELENCO'}
          className="ui-blocco con-stacco"
        >
          <p className="ui-dialog-hint">
            Il tuo <b>numero Achivia</b>, la lettera che scrivi qui, le competenze certificate da
            aziende con abbonamento, i tuoi achievement, dove hai lavorato e per quanto.
          </p>
          <p className="ui-dialog-hint">
            <b>Non</b> vedono il tuo nome, il cognome, l’email, il nickname o l’avatar. Non vedono
            i crediti, le assenze, i ritardi né la percentuale di quest riuscite.
          </p>
        </TerminalPanel>

        <label className="label">Due righe su di te</label>
        <p className="ui-dialog-hint">
          Se non sai da dove cominciare, rispondi a queste tre e il testo si scrive da sé. Poi
          puoi riscriverlo come vuoi: quello che conta è quello che c’è nel riquadro sotto.
        </p>
        <div className="lav-guida">
          {DOMANDE.map((d) => (
            <label className="label" key={d.id}>
              {d.etichetta}
              <input
                name={`guida-${d.id}`}
                value={risposte[d.id]}
                maxLength={120}
                onChange={(e) => setRisposte({ ...risposte, [d.id]: e.target.value })}
                placeholder={d.esempio}
              />
            </label>
          ))}
        </div>
        <Button
          variante="secondario"
          compatto
          disabled={!componi(risposte)}
          onClick={() => setLettera(componi(risposte))}
        >
          {lettera.trim() ? 'Riscrivi la lettera con queste risposte' : 'Scrivi la lettera'}
        </Button>

        <label className="label" htmlFor="lettera">La tua lettera</label>
        <textarea
          id="lettera"
          name="lettera"
          rows={6}
          maxLength={MAX_LETTERA}
          value={lettera}
          onChange={(e) => setLettera(e.target.value)}
          placeholder="Che cosa sai fare, che cosa cerchi, che cosa ti interessa imparare."
        />
        <small className="ui-dialog-hint">{lettera.length}/{MAX_LETTERA}</small>

        <label className="label">Dove sei disposto a lavorare</label>
        {zone.length > 0 && (
          <ul className="menu-list ui-blocco">
            {zone.map((z, i) => (
              <li key={`${z.continente}-${z.paese}-${z.area}`} className="menu-item lav-zona">
                <span>{nomeZona(z)}</span>
                <Button
                  variante="fantasma"
                  compatto
                  onClick={() => setZone(zone.filter((_, j) => j !== i))}
                >
                  Togli
                </Button>
              </li>
            ))}
          </ul>
        )}
        <div className="lb-filtri">
          <label className="label">
            Continente
            <select
              value={bozza.continente}
              onChange={(e) => setBozza({ continente: e.target.value, stato: '', regione: '' })}
            >
              <option value="">Scegli…</option>
              {CONTINENTI.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </label>
          <label className="label">
            Paese
            <select
              value={bozza.paese}
              disabled={!bozza.continente}
              onChange={(e) => setBozza({ ...bozza, paese: e.target.value, area: '' })}
            >
              <option value="">Tutto il continente</option>
              {paesiDi(bozza.continente).map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
            </select>
          </label>
          <label className="label">
            {/* Non "regione" dappertutto: in Svizzera e' un cantone, in
                Germania un Land, negli Stati Uniti uno stato. */}
            {nomeLivelloArea(bozza.paese)}
            <select
              value={bozza.area}
              disabled={!areeDi(bozza.paese).length}
              onChange={(e) => setBozza({ ...bozza, area: e.target.value })}
            >
              <option value="">Tutto il paese</option>
              {areeDi(bozza.paese).map((a) => <option key={a.nome} value={a.nome}>{a.nome}</option>)}
            </select>
          </label>
        </div>
        <Button variante="secondario" compatto disabled={!bozza.continente} onClick={aggiungiZona}>
          Aggiungi
        </Button>

        <label className="label">Lingue che parli</label>
        <Chips
          items={LINGUE.map((l) => ({ id: l.id, label: l.nome }))}
          value={lingue}
          multipla
          onChange={setLingue}
          ariaLabel="Lingue parlate"
        />

        <TerminalPanel
          titolo="CHE LAVORO CERCHI"
          meta="FACOLTATIVO"
          className="ui-blocco con-stacco"
        >
          <p className="ui-dialog-hint">
            Le competenze certificate dicono che cosa hai fatto. Questo dice che cosa vuoi fare
            adesso, ed è l’unica parte del profilo che guarda avanti: senza, rischi di essere
            trovato per un ruolo che non stai cercando. Ogni campo si può lasciare vuoto, e
            lasciarlo vuoto non ti esclude da nessuna ricerca.
          </p>
          <label className="label" htmlFor="mestiere">Ruolo che cerchi</label>
          <input
            id="mestiere"
            name="mestiere"
            maxLength={60}
            value={cerca.mestiere}
            onChange={(e) => setCerca({ ...cerca, mestiere: e.target.value })}
            placeholder="Analista dati, capo turno, progettista…"
          />
          <div className="lb-filtri">
            {[
              ['disponibilita', 'Disponibile', DISPONIBILITA],
              ['contratto', 'Contratto', CONTRATTI],
              ['orario', 'Orario', ORARI],
              ['remoto', 'Dove', MODI_REMOTO],
            ].map(([campo, etichetta, elenco]) => (
              <label className="label" key={campo}>
                {etichetta}
                <select
                  value={cerca[campo]}
                  onChange={(e) => setCerca({ ...cerca, [campo]: e.target.value })}
                >
                  <option value="">Non lo dico</option>
                  {elenco.map((o) => <option key={o.id} value={o.id}>{o.nome}</option>)}
                </select>
              </label>
            ))}
          </div>
        </TerminalPanel>

        <TerminalPanel
          titolo="LA TUA POSIZIONE"
          meta={posizione ? 'DATA' : 'NON DATA'}
          className="ui-blocco con-stacco"
        >
          <p className="ui-dialog-hint">
            Serve solo a comparire in una ricerca del tipo «entro 50 km da Milano». È facoltativa:
            senza, resti cercabile lo stesso, ma la tua distanza viene calcolata dal centro della
            prima zona che hai indicato qui sopra — molto più alla larga.
          </p>
          <p className="ui-dialog-hint">
            Se la dai, viene letta <b>una volta sola</b>, adesso, e prima di essere salvata viene
            arrotondata a una griglia di {PASSO_GRIGLIA_KM} km: quello che resta scritto è un
            quadrato, non un indirizzo. Non viene mai letta di nuovo da sola e non viene seguita
            nel tempo. Chi cerca vede «entro 25 km», mai una distanza esatta.
          </p>
          <div className="oss-scarico">
            <Button variante="secondario" compatto onClick={prendiPosizione}>
              {posizione ? 'Aggiorna la posizione' : 'Usa la mia posizione'}
            </Button>
            {posizione && (
              <Button variante="fantasma" compatto onClick={scordaPosizione}>Togli la posizione</Button>
            )}
            <small className="ui-dialog-hint">
              {esitoGeo === 'attesa' && 'Sto chiedendo al browser…'}
              {esitoGeo === 'negato' && 'Permesso negato dal browser: resti cercabile con la zona che hai indicato.'}
              {esitoGeo === 'non-disponibile' && 'Questo browser non sa dire dove sei.'}
              {esitoGeo === 'non-riuscito' && 'Non è riuscito a leggerla. Riprova più tardi.'}
              {!esitoGeo && posizione && 'Posizione registrata, arrotondata alla griglia.'}
              {!esitoGeo && !posizione && 'Nessuna posizione registrata.'}
              {esitoGeo === 'presa' && 'Fatto: registrata la cella, non il punto.'}
            </small>
          </div>
        </TerminalPanel>

        <TerminalPanel titolo="TERMINI E CONDIZIONI" className="ui-blocco con-stacco">
          <p className="ui-dialog-hint">
            Accettando, autorizzi Achivia a mostrare il tuo numero Achivia, la lettera, le
            competenze certificate da organizzazioni con abbonamento, gli achievement e lo storico
            lavorativo alle organizzazioni abilitate a cercare persone, e a ricevere da loro
            messaggi. Il tuo nome non viene mai mostrato.
          </p>
          <p className="ui-dialog-hint">
            Se hai scelto di dare la posizione, autorizzi anche a mostrare in che fascia di
            distanza ti trovi rispetto a chi cerca — mai una distanza esatta, mai un indirizzo.
            Puoi togliere la sola posizione lasciando il resto.
          </p>
          <p className="ui-dialog-hint">
            Puoi revocare in qualunque momento: da quel momento il tuo profilo esce dall’elenco e
            nessuno può più scriverti.
          </p>
          {/* TESTO PROVVISORIO. Le tre righe qui sopra descrivono con
              precisione che cosa fa il codice, ma non sono termini
              legali: prima di andare in produzione vanno sostituite con
              quelli veri, che scrive Riccardo. */}
          <div className="lav-accetto">
            <input
              type="checkbox"
              id="accetta-termini"
              name="accetta-termini"
              checked={accetta}
              onChange={(e) => setAccetta(e.target.checked)}
            />
            <label htmlFor="accetta-termini">Ho letto e accetto</label>
          </div>
        </TerminalPanel>

        <div className="oss-scarico">
          <Button variante="primario" disabled={!puoSalvare} onClick={salva}>
            {attiva ? 'Aggiorna' : 'Mettimi in elenco'}
          </Button>
          {attiva && (
            <Button variante="pericolo" compatto onClick={() => setRevoca(true)}>
              Revoca il consenso
            </Button>
          )}
          {salvato && <small className="ui-dialog-hint">Salvato.</small>}
          {!puoSalvare && !attiva && (
            <small className="ui-dialog-hint">
              Servono la lettera, almeno una zona e l’accettazione dei termini.
            </small>
          )}
        </div>
      </div>

      {revoca && (
        <ConfirmDialog
          titolo="Revocare il consenso?"
          testo="Il tuo profilo esce subito dall’elenco e nessuno potrà più scriverti. Quello che hai scritto resta salvato: puoi rimetterti in elenco quando vuoi."
          conferma="Revoca"
          distruttiva
          onConferma={togli}
          onChiudi={() => setRevoca(false)}
        />
      )}
    </div>
  );
}
