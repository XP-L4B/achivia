import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import PageShell from '../../components/ui/PageShell';
import Chips from '../../components/ui/Chips';
import Emblema from '../../components/ui/Emblema';
import PremioPosizione from '../../components/ui/PremioPosizione';
import TerminalPanel from '../../components/terminal/TerminalPanel';
import { useAuth } from '../../context/AuthContext';
import { getUserById, orgPersonalizzata } from '../../data/db';
import {
  PARAMETRI, DIMENSIONI, PERIODI, ANZIANITA, PERIODO_PREDEFINITO,
  classifica, parametroById, schedeOrg, giorniDi, orgPremium,
} from '../../data/classifica';

/**
 * Achivia Leaderboard: le organizzazioni premium, in fila sul parametro
 * scelto.
 *
 * I filtri non sono un vezzo: una classifica in cui una societa' da
 * duecento persone e una famiglia da cinque stanno nella stessa colonna non
 * dice niente a nessuna delle due. La fascia di dimensione — e la stagione,
 * e l'anzianita' — servono a far competere chi si assomiglia.
 *
 * Nessun credito compare qui, ne' come punteggio ne' come cifra: quanto
 * un'azienda paga i suoi non e' materia da vetrina.
 */
export default function LeaderboardPage() {
  const { user } = useAuth();
  const me = user ? getUserById(user.id) || user : null;

  const [parametro, setParametro] = useState(PARAMETRI[0].id);
  const [dimensione, setDimensione] = useState('tutte');
  const [periodo, setPeriodo] = useState(PERIODO_PREDEFINITO);
  const [anzianita, setAnzianita] = useState('tutte');
  const [soloAttive, setSoloAttive] = useState(false);

  const par = parametroById(parametro);
  const giorni = giorniDi(periodo);

  // Le schede costano un giro sui dati di ogni organizzazione: si fanno una
  // volta per periodo, e i filtri lavorano su quelle.
  const schede = useMemo(() => schedeOrg({ giorni }), [giorni]);
  const righe = useMemo(
    () => classifica({ parametro, dimensione, periodo, anzianita, soloAttive, schede }),
    [parametro, dimensione, periodo, anzianita, soloAttive, schede]
  );

  // Dove sta la propria organizzazione, con i filtri di adesso. Se i filtri
  // l'hanno tagliata fuori si dice quello, invece di far cercare una riga
  // che non c'e'.
  const mia = me?.orgId ? righe.find((r) => r.orgId === me.orgId) : null;
  const miaPremium = Boolean(me?.orgId) && orgPremium(me.orgId);
  // Un'organizzazione personalizzata non e' fuori classifica: e' fuori dalla lega,
  // che e' un'altra cosa e va detta con parole diverse.
  const miaPersonalizzata = Boolean(me?.orgId) && orgPersonalizzata(me.orgId);

  return (
    <>
      <PageShell
        title="Achivia Leaderboard"
        description="Le organizzazioni con abbonamento premium, confrontate sui risultati che si sono guadagnate."
      />

      <div className="ui-corpo-pagina">
        <div className="oss-ricerca">
          <label className="label">
            Parametro
            <select value={parametro} onChange={(e) => setParametro(e.target.value)}>
              <optgroup label="Numeri">
                {PARAMETRI.filter((p) => !p.medaglia).map((p) => (
                  <option key={p.id} value={p.id}>{p.nome}</option>
                ))}
              </optgroup>
              <optgroup label="Medaglie">
                {PARAMETRI.filter((p) => p.medaglia).map((p) => (
                  <option key={p.id} value={p.id}>{p.nome}</option>
                ))}
              </optgroup>
            </select>
          </label>
          <p className="ui-dialog-hint">{par.nota}</p>

          <label className="label">Dimensione</label>
          <Chips
            items={DIMENSIONI.map((d) => ({ id: d.id, label: d.nome }))}
            value={dimensione}
            onChange={setDimensione}
            ariaLabel="Fascia di dimensione"
          />

          <label className="label">Periodo</label>
          <Chips
            items={PERIODI.map((p) => ({ id: p.id, label: p.nome }))}
            value={periodo}
            onChange={setPeriodo}
            ariaLabel="Periodo"
          />

          <div className="lb-filtri">
            <label className="label">
              Anzianità
              <select value={anzianita} onChange={(e) => setAnzianita(e.target.value)}>
                {ANZIANITA.map((a) => <option key={a.id} value={a.id}>{a.nome}</option>)}
              </select>
            </label>
          </div>

          <label className="px-check lb-attive">
            <input
              type="checkbox"
              checked={soloAttive}
              onChange={(e) => setSoloAttive(e.target.checked)}
              style={{ width: 'auto' }}
            />
            <span className="label">Solo organizzazioni attive negli ultimi 90 giorni</span>
          </label>

        
        </div>

        <TerminalPanel
          titolo={par.nome.toUpperCase()}
          meta={`${righe.length} ${righe.length === 1 ? 'organizzazione' : 'organizzazioni'}`}
          piede={`PERIODO: ${PERIODI.find((p) => p.id === periodo).nome.toUpperCase()}`}
          className="ui-blocco con-stacco lb-pannello"
        >
          {righe.length === 0 ? (
            <p className="tv-vuoto">Nessuna organizzazione premium con questi filtri.</p>
          ) : (
            /* La classifica scorre per conto suo: cinquecento organizzazioni
               non devono diventare cinquecento schermate di pagina, e quello
               che sta sotto — la propria posizione — deve restare a portata. */
            <ol className="lb-lista">
              {righe.map((riga) => (
                <li key={riga.orgId} className={`lb-riga${riga.orgId === me?.orgId ? ' is-mia' : ''}`}>
                  <Link to={`/leaderboard/${riga.orgId}?periodo=${periodo}`} className="lb-link">
                    <span className="lb-posto">{riga.posizione}</span>
                    <span className="lb-premio">
                      <PremioPosizione famiglia={par.famiglia} premio={riga.premio} size={44} />
                    </span>
                    <span className="lb-insegna">
                      <Emblema orgId={riga.orgId} nomeOrg={riga.nome} size={30} />
                    </span>
                    <span className="lb-nome">
                      <b>{riga.nome}</b>
                      <small>
                        {riga.membri} {riga.membri === 1 ? 'persona' : 'persone'}
                        {riga.orgId === me?.orgId ? ' · la tua' : ''}
                      </small>
                    </span>
                    <span className="lb-valore">{par.formato(riga.valore)}</span>
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </TerminalPanel>

        {/* Appena sotto la finestra: dove sta la propria organizzazione, che
            e' la prima cosa che si cerca in una classifica. */}
        {me?.orgId && (
          <section className="lb-mia">
            {mia ? (
              <Link to={`/leaderboard/${mia.orgId}?periodo=${periodo}`} className="lb-mia-corpo">
                <span className="lb-mia-premio">
                  <PremioPosizione famiglia={par.famiglia} premio={mia.premio} size={48} />
                </span>
                <span className="lb-mia-testo">
                  <small>La tua organizzazione</small>
                  <b>{mia.nome}</b>
                  <span className="lb-mia-riga">
                    {mia.posizione}ª su {righe.length} · {par.nome.toLowerCase()}: {par.formato(mia.valore)}
                    {mia.premio ? ` · ${mia.premio.tipo === 'podio' ? mia.premio.nome : mia.premio.fascia.nome}` : ''}
                  </span>
                </span>
              </Link>
            ) : (
              <p className="lb-mia-fuori">
                {miaPersonalizzata
                  ? 'La lega è delle aziende. Un’organizzazione personalizzata — un gruppo, un clan — non ci entra: quello che succede lì dentro resta lì dentro, ed è il motivo per cui esiste.'
                  : miaPremium
                    ? 'La tua organizzazione non rientra in questi filtri: cambia fascia, periodo o anzianità per ritrovarla.'
                    : 'La tua organizzazione non è in classifica: la lega è delle aziende con abbonamento premium.'}
              </p>
            )}
          </section>
        )}

        <p className="ui-dialog-hint">
          Prime tre posizioni: oro, argento e bronzo. Dalla quarta in giù la stessa
          medaglia in metallo neutro dentro un anello inciso — TOP 25, TOP 50, TOP 100,
          TOP 500. A parimerito si condivide la posizione, e la medaglia va a tutte.
        </p>
      </div>
    </>
  );
}
