/**
 * Il formato delle cifre del terminale.
 *
 * Le migliaia col punto: `12450` diventa `12.450`. Un numero lungo senza
 * separatore, in un carattere a larghezza fissa, si conta una cifra alla
 * volta — che e' esattamente quello che un pannello di dati deve evitare.
 *
 * Sta in un file suo e non accanto ai componenti perche' non e' un
 * componente: mescolarlo agli altri export rompe il ricaricamento a caldo.
 */
export const cifra = (n) => Number(n ?? 0).toLocaleString('it-IT');
