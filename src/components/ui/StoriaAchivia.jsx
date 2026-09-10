import { useState } from 'react';
import useScrivania from '../../hooks/useScrivania';
import { avatarById } from '../../data/avatars';

/**
 * La storia di Achivia, sulla porta d'ingresso.
 *
 * Chi arriva qui per la prima volta non sa che cos'e' Achivia: un modulo di
 * accesso, da solo, non lo dice. Questo riquadro lo dice, e lo dice con le
 * parole del regno invece che con quelle di un manuale.
 *
 * I tre personaggi accanto non sono decorazione a caso: sono le tre figure
 * con cui la storia si apre — un artigiano, uno studioso, un mercante — e
 * arrivano dagli avatar che l'app ha gia', non da disegni nuovi. Sono
 * decorativi per davvero, quindi lo screen reader non li nomina: quello che
 * dicono e' gia' scritto nella prima riga del testo.
 *
 * Da telefono il racconto parte chiuso. Sopra il modulo ci sta il titolo e
 * niente di piu': chi torna per la centesima volta vuole i campi, non la
 * storia, e chi arriva la prima volta la apre. Da scrivania sta di fianco e
 * non ruba niente a nessuno, quindi parte aperto.
 *
 * E' un `<details>`, cioe' l'apri-e-chiudi che il browser ha gia': funziona
 * col tocco, col clic e con la tastiera, e chi non vede lo schermo sente che
 * e' un gruppo che si puo' aprire senza che si debba spiegarglielo.
 */
const COMPAGNIA = ['14', '3', '36'];   // il fabbro, il mago, il viandante


export default function StoriaAchivia() {
  const scrivania = useScrivania();
  // Finche' nessuno tocca niente decide lo schermo: aperta di fianco al
  // modulo, chiusa sopra. Al primo tocco decide chi legge, e da li' in poi
  // la storia resta come l'ha lasciata — anche girando il telefono.
  const [scelta, setScelta] = useState(null);
  const aperta = scelta ?? scrivania;

  return (
    <details
      className="storia"
      open={aperta}
      onToggle={(e) => setScelta(e.currentTarget.open)}
    >
      <summary className="storia-testa">
        <span className="storia-testa-testo">
          <span className="storia-titolo">Benvenuti nel regno di Achivia</span>
        </span>
        <span className="storia-invito">Leggi la storia</span>
        {/* La freccia dice che c'e' dell'altro sotto, e girandosi dice che
            adesso e' aperto: e' l'unica cosa che si muove qui dentro. */}
        <svg className="storia-freccia" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
          <path d="M5 9l7 7 7-7" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </summary>

      <div className="storia-corpo">
        <div className="storia-compagnia" aria-hidden="true">
          {COMPAGNIA.map((id) => (
            <img key={id} className="storia-avatar" src={avatarById(id)} alt="" />
          ))}
        </div>

        <div className="storia-testo">
          <div className="storia-riga" aria-hidden="true" />

          <p>
            Un crocevia di artigiani, studiosi e mercanti la cui forza resta
            frammentata da viaggi solitari e segreti custoditi. Tutto iniziò con
            l’arrivo del Primo Architetto. Senza eserciti né corone, eresse una
            sola piazza al centro del continente, incidendovi un principio
            fondamentale: <em>«Nessuno costruisce un regno da solo.»</em>
          </p>
          <p>
            Intorno a quella piazza nacquero le prime Compagnie: unioni di
            talenti diversi nate per realizzare ciò che il singolo non avrebbe
            mai potuto compiere. Con esse sorsero officine, accademie e città.
            Nacque così Achivia, il Regno dei Viandanti, fondato sull’idea che la
            vera ricchezza non risieda nelle miniere, ma nelle persone.
          </p>

          <p className="storia-soprattitolo">Cosa troverai ad Achivia</p>
          <ul className="storia-punti">
            <li>
              <b>Le Compagnie.</b> Cuore pulsante del regno: creano beni,
              esplorano territori e proteggono villaggi. Ogni membro apporta un
              valore unico, trasformando piccole botteghe in grandi
              organizzazioni.
            </li>
            <li>
              <b>La Reputazione e le Missioni.</b> Il valore non si misura da ciò
              che si possiede, ma dal percorso compiuto. Affrontando Missioni
              individuali o cooperative, i Viandanti forgiano la propria
              reputazione e fanno prosperare la comunità.
            </li>
            <li>
              <b>Esperienza e Crediti.</b> Ogni successo genera Esperienza (XP)
              per evolvere le proprie abilità, mentre la prosperità condivisa genera
              Crediti da reinvestire nel Mercato: la ricchezza cresce solo quando
              il valore viene rimesso in circolo.
            </li>
            <li>
              <b>Gli Alberi delle Abilità.</b> Nelle Sale delle Competenze
              l’impegno trasforma le capacità in medaglie, dalla leadership alla
              creatività, sbloccando continue opportunità di crescita.
            </li>
          </ul>

          <p className="storia-attacco">Achivia sostiene un principio inciso sulle sue mura:</p>
          <p className="storia-motto">
            «Un regno diventa ricco quando i suoi abitanti diventano più ricchi
            di possibilità.»
          </p>
          <p>
            Non è un mondo già scritto, ma un’opera in continua costruzione. Che
            tu cerchi fortuna, libertà o una nuova impresa, le strade sono
            aperte.
          </p>
          <p className="storia-chiusa">Benvenuto ad Achivia. La tua strada comincia qui.</p>
        </div>
      </div>
    </details>
  );
}
