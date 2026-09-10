/**
 * Un fumetto: quello che dice qualcuno, con la coda che indica chi.
 *
 * Ce ne sono due in scena e **non si sovrappongono mai**, e non per
 * fortuna: quello della richiesta sta in alto a sinistra sopra chi e'
 * entrato, quello della scelta in basso a destra vicino al capo, e tutti e
 * due hanno un tetto di altezza del quaranta per cento della scena. Due
 * riquadri da quaranta, uno appoggiato in alto e uno in basso, non possono
 * incontrarsi nemmeno quando il testo e' lungo e lo schermo e' piccolo: al
 * massimo quello lungo scorre dentro di se'.
 *
 * La coda e' un triangolo disegnato con i bordi — niente immagini, niente
 * SVG — e cambia lato secondo `verso`: `giu-sinistra` per chi parla sotto
 * a sinistra (il dipendente), `sinistra` per chi parla a sinistra (il
 * capo, visto da un fumetto che gli sta a destra).
 *
 * Gli angoli sono quelli di Achivia — le tacche a squadra arrivano dalla
 * classe `ui-tile` — perche' un fumetto e' una superficie come le altre, e
 * una superficie nuova senza tacche si riconosce subito come venuta da
 * fuori.
 *
 * Quando il testo non ci sta, scorre: `tb-scorre` fa scorrere **e lo fa
 * vedere**, con la barra sottile e l'ombra ai bordi. Un fumetto che taglia
 * la richiesta a meta' senza dirlo e' peggio di un fumetto piccolo.
 */
export default function Fumetto({ dove, verso, titolo, meta, children, className = '' }) {
  return (
    <div className={`ui-tile tb-scorre tb-fumetto is-${dove} ${className}`}>
      {(titolo || meta) && (
        <p className="tb-fumetto-chi">
          {titolo && <b>{titolo}</b>}
          {meta && <small>{meta}</small>}
        </p>
      )}
      {children}
      <span className={`tb-coda is-${verso}`} aria-hidden="true" />
    </div>
  );
}
