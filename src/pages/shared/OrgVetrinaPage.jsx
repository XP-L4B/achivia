import { useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import PageShell from '../../components/ui/PageShell';
import Emblema from '../../components/ui/Emblema';
import PremioPosizione from '../../components/ui/PremioPosizione';
import TerminalPanel from '../../components/terminal/TerminalPanel';
import TerminalRows from '../../components/terminal/TerminalRows';
import {
  schedaOrg, posizioniDi, orgPremium, giorniDi, PERIODI, PERIODO_PREDEFINITO,
} from '../../data/classifica';

/**
 * La scheda pubblica di un'organizzazione, aperta dalla classifica.
 *
 * Mostra esattamente quello che la classifica mostra — gli stessi otto
 * parametri, con la posizione e la medaglia di ognuno — e nient'altro: chi
 * ci lavora, quanto guadagna, che quest ha in corso restano cose sue. Una
 * vetrina e' una vetrina, non una finestra sul retrobottega.
 */
export default function OrgVetrinaPage() {
  const { orgId } = useParams();
  const [parametri] = useSearchParams();
  // La stagione arriva dalla classifica da cui si e' cliccato: aprire una
  // scheda non deve cambiare la lente con cui si stava guardando.
  const periodo = PERIODI.some((p) => p.id === parametri.get('periodo'))
    ? parametri.get('periodo')
    : PERIODO_PREDEFINITO;
  const premium = orgPremium(orgId);
  const scheda = useMemo(
    () => (premium ? schedaOrg(orgId, { giorni: giorniDi(periodo) }) : null),
    [orgId, premium, periodo]
  );
  const posizioni = useMemo(
    () => (premium ? posizioniDi(orgId, { periodo }) : []),
    [orgId, premium, periodo]
  );

  if (!premium || !scheda) {
    return (
      <>
        <PageShell
          title="Organizzazione"
          description="Questa organizzazione non è in classifica: la vetrina è delle sole premium."
        />
      </>
    );
  }

  const anni = Math.floor(scheda.anzianita / 365);
  const eta = anni >= 1
    ? `${anni} ${anni === 1 ? 'anno' : 'anni'} su Achivia`
    : `${Math.max(1, Math.floor(scheda.anzianita / 30))} mesi su Achivia`;

  return (
    <>
      <PageShell
        title={scheda.nome}
        description={`Come va questa organizzazione, con gli stessi numeri della classifica — ${PERIODI.find((p) => p.id === periodo).nome.toLowerCase()}.`}
      />

      <div className="ui-corpo-pagina">
        <section className="px-panel vetrina-testa">
          <Emblema orgId={orgId} nomeOrg={scheda.nome} size={84} titolo={`Insegna di ${scheda.nome}`} />
          <div>
            <b className="vetrina-nome">{scheda.nome}</b>
            <p className="vetrina-riga">
              {scheda.tipo === 'personalizzata' ? 'Organizzazione personalizzata' : 'Azienda'}
              {' · '}{scheda.membri} {scheda.membri === 1 ? 'persona' : 'persone'}
              {' · '}{eta}
            </p>
            <p className="vetrina-riga">
              {scheda.attiva ? 'Attiva negli ultimi 90 giorni' : 'Nessuna quest chiusa negli ultimi 90 giorni'}
            </p>
          </div>
        </section>

        {posizioni.map(({ parametro, valore, posizione, premio, su }) => (
          <TerminalPanel
            key={parametro.id}
            titolo={parametro.nome.toUpperCase()}
            meta={posizione ? `${posizione}° su ${su}` : `— su ${su}`}
            className="ui-blocco con-stacco vetrina-parametro"
          >
            <div className="vetrina-parametro-corpo">
              <PremioPosizione famiglia={parametro.famiglia} premio={premio} size={56} />
              <div className="vetrina-parametro-testo">
                <span className="vetrina-valore">{parametro.formato(valore)}</span>
                <small>{parametro.nota}</small>
              </div>
            </div>
          </TerminalPanel>
        ))}

        {/* Il quadro in una riga sola, per chi vuole solo il colpo d'occhio. */}
        <TerminalPanel titolo="IN BREVE" className="ui-blocco con-stacco">
          <TerminalRows
            voci={posizioni.map(({ parametro, valore, posizione }) => ({
              id: parametro.id,
              label: parametro.nome,
              valore: `${parametro.formato(valore)}${posizione ? ` · ${posizione}°` : ''}`,
            }))}
          />
        </TerminalPanel>
      </div>
    </>
  );
}
