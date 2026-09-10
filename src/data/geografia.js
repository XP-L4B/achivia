/**
 * Dove una persona e' disposta a lavorare, e dove si trova.
 *
 * Tre livelli — continente, paese, area — perche' e' cosi' che si ragiona
 * quando ci si sposta davvero: c'e' chi si muove in tutta Europa, chi solo
 * in Italia, e chi non esce dalla sua regione. Un filtro con un livello solo
 * non saprebbe distinguerli.
 *
 * Il terzo livello non si chiama allo stesso modo dappertutto, e chiamarlo
 * "regione" ovunque farebbe scrivere all'interfaccia cose come "Paese: Stati
 * Uniti, Regione: Texas" — che a un americano suona sbagliata quanto a noi
 * "Regione: Italia, Provincia: Lombardia". Ogni paese porta percio'
 * l'etichetta giusta per casa sua: regione, stato, cantone, Land,
 * provincia, comunita' autonoma, distretto, voivodato, contea, nazione.
 *
 * Un paese senza aree non e' un errore: chi lo sceglie dichiara
 * disponibilita' su tutto il paese, ed e' un'informazione completa. Le aree
 * ci sono per i paesi in cui l'applicazione si usa adesso; aggiungerne uno
 * vuol dire aggiungere righe a questo file, non toccare il codice.
 *
 * LE COORDINATE. Ogni voce porta un centro approssimato, e serve a una cosa
 * sola: dire quanto dista un posto da un altro. Non sono confini e non sono
 * indirizzi — il centro della Lombardia non e' dove abita nessuno. Sono
 * buone a qualche decina di chilometri, che e' esattamente la precisione con
 * cui la ricerca per distanza si dichiara. Un paese grande senza aree (il
 * Brasile, l'Australia) ha un solo centro per tutto il territorio, e li' la
 * distanza dice poco: le prove verificano che ogni centro cada dentro il suo
 * paese, non che sia preciso al chilometro.
 */

export const CONTINENTI = [
  { id: 'europa',       nome: 'Europa',       lat: 54.0, lon: 15.0 },
  { id: 'africa',       nome: 'Africa',       lat: 2.0,  lon: 20.0 },
  { id: 'asia',         nome: 'Asia',         lat: 45.0, lon: 90.0 },
  { id: 'nordamerica',  nome: 'Nord America', lat: 45.0, lon: -100.0 },
  { id: 'sudamerica',   nome: 'Sud America',  lat: -15.0, lon: -60.0 },
  { id: 'oceania',      nome: 'Oceania',      lat: -25.0, lon: 140.0 },
];

/* I paesi, con dentro le loro aree dove ci sono. `area` e' come si chiama
   il terzo livello da quelle parti. */
export const PAESI = [
  { id: 'it', nome: 'Italia', continente: 'europa', lat: 42.8, lon: 12.6, area: 'Regione',
    aree: [
      { nome: 'Abruzzo', lat: 42.2, lon: 13.8 },
      { nome: 'Basilicata', lat: 40.5, lon: 16.1 },
      { nome: 'Calabria', lat: 38.9, lon: 16.4 },
      { nome: 'Campania', lat: 40.8, lon: 14.8 },
      { nome: 'Emilia-Romagna', lat: 44.6, lon: 11.0 },
      { nome: 'Friuli-Venezia Giulia', lat: 46.1, lon: 13.1 },
      { nome: 'Lazio', lat: 41.9, lon: 12.7 },
      { nome: 'Liguria', lat: 44.3, lon: 8.8 },
      { nome: 'Lombardia', lat: 45.6, lon: 9.7 },
      { nome: 'Marche', lat: 43.4, lon: 13.2 },
      { nome: 'Molise', lat: 41.7, lon: 14.6 },
      { nome: 'Piemonte', lat: 45.1, lon: 7.9 },
      { nome: 'Puglia', lat: 41.0, lon: 16.6 },
      { nome: 'Sardegna', lat: 40.1, lon: 9.0 },
      { nome: 'Sicilia', lat: 37.6, lon: 14.0 },
      { nome: 'Toscana', lat: 43.4, lon: 11.1 },
      { nome: 'Trentino-Alto Adige', lat: 46.4, lon: 11.3 },
      { nome: 'Umbria', lat: 42.9, lon: 12.5 },
      { nome: 'Valle d’Aosta', lat: 45.7, lon: 7.4 },
      { nome: 'Veneto', lat: 45.6, lon: 11.9 },
    ],
  },
  { id: 'fr', nome: 'Francia', continente: 'europa', lat: 46.6, lon: 2.4, area: 'Regione',
    aree: [
      { nome: 'Alvernia-Rodano-Alpi', lat: 45.5, lon: 4.5 },
      { nome: 'Borgogna-Franca Contea', lat: 47.2, lon: 4.8 },
      { nome: 'Bretagna', lat: 48.2, lon: -2.9 },
      { nome: 'Centro-Valle della Loira', lat: 47.5, lon: 1.7 },
      { nome: 'Corsica', lat: 42.2, lon: 9.1 },
      { nome: 'Grand Est', lat: 48.7, lon: 5.6 },
      { nome: 'Alta Francia', lat: 49.9, lon: 2.8 },
      { nome: 'Île-de-France', lat: 48.7, lon: 2.5 },
      { nome: 'Normandia', lat: 49.1, lon: 0.1 },
      { nome: 'Nuova Aquitania', lat: 45.2, lon: 0.2 },
      { nome: 'Occitania', lat: 43.7, lon: 2.0 },
      { nome: 'Paesi della Loira', lat: 47.5, lon: -0.8 },
      { nome: 'Provenza-Alpi-Costa Azzurra', lat: 43.9, lon: 6.0 },
      { nome: 'Guadalupa', lat: 16.2, lon: -61.5 },
      { nome: 'Martinica', lat: 14.6, lon: -61.0 },
      { nome: 'Guyana francese', lat: 4.0, lon: -53.0 },
      { nome: 'Riunione', lat: -21.1, lon: 55.5 },
      { nome: 'Mayotte', lat: -12.8, lon: 45.2 },
    ],
  },
  { id: 'de', nome: 'Germania', continente: 'europa', lat: 51.2, lon: 10.4, area: 'Land',
    aree: [
      { nome: 'Baden-Württemberg', lat: 48.7, lon: 9.1 },
      { nome: 'Baviera', lat: 48.9, lon: 11.5 },
      { nome: 'Berlino', lat: 52.5, lon: 13.4 },
      { nome: 'Brandeburgo', lat: 52.4, lon: 13.0 },
      { nome: 'Brema', lat: 53.1, lon: 8.8 },
      { nome: 'Amburgo', lat: 53.6, lon: 10.0 },
      { nome: 'Assia', lat: 50.6, lon: 9.0 },
      { nome: 'Meclemburgo-Pomerania Anteriore', lat: 53.6, lon: 12.5 },
      { nome: 'Bassa Sassonia', lat: 52.6, lon: 9.6 },
      { nome: 'Renania Settentrionale-Vestfalia', lat: 51.5, lon: 7.5 },
      { nome: 'Renania-Palatinato', lat: 49.9, lon: 7.5 },
      { nome: 'Saarland', lat: 49.4, lon: 7.0 },
      { nome: 'Sassonia', lat: 51.0, lon: 13.4 },
      { nome: 'Sassonia-Anhalt', lat: 52.0, lon: 11.7 },
      { nome: 'Schleswig-Holstein', lat: 54.2, lon: 9.7 },
      { nome: 'Turingia', lat: 50.9, lon: 11.0 },
    ],
  },
  { id: 'es', nome: 'Spagna', continente: 'europa', lat: 40.0, lon: -3.7, area: 'Comunità autonoma',
    aree: [
      { nome: 'Andalusia', lat: 37.5, lon: -4.8 },
      { nome: 'Aragona', lat: 41.5, lon: -0.7 },
      { nome: 'Asturie', lat: 43.3, lon: -6.0 },
      { nome: 'Baleari', lat: 39.6, lon: 2.9 },
      { nome: 'Canarie', lat: 28.3, lon: -16.0 },
      { nome: 'Cantabria', lat: 43.2, lon: -4.0 },
      { nome: 'Castiglia-La Mancia', lat: 39.5, lon: -3.0 },
      { nome: 'Castiglia e León', lat: 41.7, lon: -4.8 },
      { nome: 'Catalogna', lat: 41.7, lon: 1.7 },
      { nome: 'Estremadura', lat: 39.2, lon: -6.1 },
      { nome: 'Galizia', lat: 42.8, lon: -8.0 },
      { nome: 'La Rioja', lat: 42.3, lon: -2.5 },
      { nome: 'Madrid', lat: 40.5, lon: -3.7 },
      { nome: 'Murcia', lat: 38.0, lon: -1.5 },
      { nome: 'Navarra', lat: 42.7, lon: -1.7 },
      { nome: 'Paesi Baschi', lat: 43.0, lon: -2.6 },
      { nome: 'Valencia', lat: 39.4, lon: -0.7 },
      { nome: 'Ceuta', lat: 35.9, lon: -5.3 },
      { nome: 'Melilla', lat: 35.3, lon: -2.9 },
    ],
  },
  { id: 'pt', nome: 'Portogallo', continente: 'europa', lat: 39.6, lon: -8.0, area: 'Distretto',
    aree: [
      { nome: 'Aveiro', lat: 40.7, lon: -8.4 },
      { nome: 'Beja', lat: 37.9, lon: -7.9 },
      { nome: 'Braga', lat: 41.6, lon: -8.3 },
      { nome: 'Bragança', lat: 41.6, lon: -6.9 },
      { nome: 'Castelo Branco', lat: 39.9, lon: -7.6 },
      { nome: 'Coimbra', lat: 40.2, lon: -8.3 },
      { nome: 'Évora', lat: 38.6, lon: -7.9 },
      { nome: 'Faro', lat: 37.2, lon: -8.0 },
      { nome: 'Guarda', lat: 40.6, lon: -7.2 },
      { nome: 'Leiria', lat: 39.8, lon: -8.7 },
      { nome: 'Lisbona', lat: 38.8, lon: -9.1 },
      { nome: 'Portalegre', lat: 39.3, lon: -7.6 },
      { nome: 'Porto', lat: 41.2, lon: -8.4 },
      { nome: 'Santarém', lat: 39.3, lon: -8.5 },
      { nome: 'Setúbal', lat: 38.3, lon: -8.6 },
      { nome: 'Viana do Castelo', lat: 41.8, lon: -8.5 },
      { nome: 'Vila Real', lat: 41.4, lon: -7.6 },
      { nome: 'Viseu', lat: 40.8, lon: -7.8 },
      { nome: 'Azzorre', lat: 37.8, lon: -25.5 },
      { nome: 'Madera', lat: 32.7, lon: -16.9 },
    ],
  },
  { id: 'ch', nome: 'Svizzera', continente: 'europa', lat: 46.8, lon: 8.2, area: 'Cantone',
    aree: [
      { nome: 'Argovia', lat: 47.4, lon: 8.1 },
      { nome: 'Appenzello Esterno', lat: 47.4, lon: 9.3 },
      { nome: 'Appenzello Interno', lat: 47.3, lon: 9.4 },
      { nome: 'Basilea Campagna', lat: 47.4, lon: 7.7 },
      { nome: 'Basilea Città', lat: 47.6, lon: 7.6 },
      { nome: 'Berna', lat: 46.9, lon: 7.6 },
      { nome: 'Friburgo', lat: 46.7, lon: 7.1 },
      { nome: 'Ginevra', lat: 46.2, lon: 6.1 },
      { nome: 'Glarona', lat: 47.0, lon: 9.1 },
      { nome: 'Grigioni', lat: 46.7, lon: 9.6 },
      { nome: 'Giura', lat: 47.3, lon: 7.1 },
      { nome: 'Lucerna', lat: 47.1, lon: 8.1 },
      { nome: 'Neuchâtel', lat: 47.0, lon: 6.8 },
      { nome: 'Nidvaldo', lat: 46.9, lon: 8.4 },
      { nome: 'Obvaldo', lat: 46.8, lon: 8.2 },
      { nome: 'San Gallo', lat: 47.2, lon: 9.3 },
      { nome: 'Sciaffusa', lat: 47.7, lon: 8.6 },
      { nome: 'Svitto', lat: 47.0, lon: 8.7 },
      { nome: 'Soletta', lat: 47.3, lon: 7.6 },
      { nome: 'Turgovia', lat: 47.6, lon: 9.1 },
      { nome: 'Ticino', lat: 46.3, lon: 8.8 },
      { nome: 'Uri', lat: 46.8, lon: 8.6 },
      { nome: 'Vallese', lat: 46.2, lon: 7.6 },
      { nome: 'Vaud', lat: 46.6, lon: 6.6 },
      { nome: 'Zugo', lat: 47.2, lon: 8.5 },
      { nome: 'Zurigo', lat: 47.4, lon: 8.6 },
    ],
  },
  { id: 'at', nome: 'Austria', continente: 'europa', lat: 47.6, lon: 14.1, area: 'Land',
    aree: [
      { nome: 'Burgenland', lat: 47.5, lon: 16.4 },
      { nome: 'Carinzia', lat: 46.7, lon: 13.9 },
      { nome: 'Bassa Austria', lat: 48.3, lon: 15.8 },
      { nome: 'Alta Austria', lat: 48.2, lon: 13.9 },
      { nome: 'Salisburgo', lat: 47.5, lon: 13.1 },
      { nome: 'Stiria', lat: 47.2, lon: 15.0 },
      { nome: 'Tirolo', lat: 47.2, lon: 11.4 },
      { nome: 'Vorarlberg', lat: 47.2, lon: 9.9 },
      { nome: 'Vienna', lat: 48.2, lon: 16.4 },
    ],
  },
  { id: 'nl', nome: 'Paesi Bassi', continente: 'europa', lat: 52.2, lon: 5.5, area: 'Provincia',
    aree: [
      { nome: 'Drenthe', lat: 52.9, lon: 6.6 },
      { nome: 'Flevoland', lat: 52.5, lon: 5.6 },
      { nome: 'Frisia', lat: 53.1, lon: 5.8 },
      { nome: 'Gheldria', lat: 52.1, lon: 5.9 },
      { nome: 'Groninga', lat: 53.2, lon: 6.7 },
      { nome: 'Limburgo', lat: 51.2, lon: 5.9 },
      { nome: 'Brabante Settentrionale', lat: 51.6, lon: 5.3 },
      { nome: 'Olanda Settentrionale', lat: 52.6, lon: 4.9 },
      { nome: 'Overijssel', lat: 52.4, lon: 6.4 },
      { nome: 'Olanda Meridionale', lat: 52.0, lon: 4.5 },
      { nome: 'Utrecht', lat: 52.1, lon: 5.2 },
      { nome: 'Zelanda', lat: 51.5, lon: 3.8 },
    ],
  },
  { id: 'be', nome: 'Belgio', continente: 'europa', lat: 50.6, lon: 4.6, area: 'Regione',
    aree: [
      { nome: 'Fiandre', lat: 51.0, lon: 4.5 },
      { nome: 'Vallonia', lat: 50.4, lon: 4.8 },
      { nome: 'Bruxelles', lat: 50.8, lon: 4.4 },
    ],
  },
  { id: 'ie', nome: 'Irlanda', continente: 'europa', lat: 53.2, lon: -8.0, area: 'Provincia',
    aree: [
      { nome: 'Leinster', lat: 53.2, lon: -6.9 },
      { nome: 'Munster', lat: 52.2, lon: -8.6 },
      { nome: 'Connacht', lat: 53.7, lon: -8.9 },
      { nome: 'Ulster', lat: 54.6, lon: -7.5 },
    ],
  },
  { id: 'gb', nome: 'Regno Unito', continente: 'europa', lat: 54.0, lon: -2.5, area: 'Nazione',
    aree: [
      { nome: 'Inghilterra', lat: 52.4, lon: -1.5 },
      { nome: 'Scozia', lat: 56.8, lon: -4.2 },
      { nome: 'Galles', lat: 52.3, lon: -3.7 },
      { nome: 'Irlanda del Nord', lat: 54.6, lon: -6.7 },
    ],
  },
  { id: 'pl', nome: 'Polonia', continente: 'europa', lat: 52.1, lon: 19.4, area: 'Voivodato',
    aree: [
      { nome: 'Bassa Slesia', lat: 51.0, lon: 16.4 },
      { nome: 'Cuiavia-Pomerania', lat: 53.1, lon: 18.4 },
      { nome: 'Lublino', lat: 51.3, lon: 22.7 },
      { nome: 'Lubusz', lat: 52.2, lon: 15.3 },
      { nome: 'Łódź', lat: 51.6, lon: 19.4 },
      { nome: 'Piccola Polonia', lat: 49.9, lon: 20.3 },
      { nome: 'Masovia', lat: 52.4, lon: 21.0 },
      { nome: 'Opole', lat: 50.7, lon: 17.9 },
      { nome: 'Precarpazia', lat: 49.9, lon: 22.2 },
      { nome: 'Podlachia', lat: 53.3, lon: 22.9 },
      { nome: 'Pomerania', lat: 54.2, lon: 17.9 },
      { nome: 'Slesia', lat: 50.4, lon: 19.0 },
      { nome: 'Santacroce', lat: 50.8, lon: 20.7 },
      { nome: 'Varmia-Masuria', lat: 53.8, lon: 20.6 },
      { nome: 'Grande Polonia', lat: 52.4, lon: 17.3 },
      { nome: 'Pomerania Occidentale', lat: 53.6, lon: 15.5 },
    ],
  },
  { id: 'se', nome: 'Svezia', continente: 'europa', lat: 62.2, lon: 15.6, area: 'Contea',
    aree: [
      { nome: 'Blekinge', lat: 56.2, lon: 15.1 },
      { nome: 'Dalarna', lat: 60.9, lon: 14.5 },
      { nome: 'Gävleborg', lat: 61.3, lon: 16.3 },
      { nome: 'Gotland', lat: 57.5, lon: 18.5 },
      { nome: 'Halland', lat: 56.9, lon: 12.9 },
      { nome: 'Jämtland', lat: 63.3, lon: 14.5 },
      { nome: 'Jönköping', lat: 57.5, lon: 14.2 },
      { nome: 'Kalmar', lat: 57.0, lon: 16.0 },
      { nome: 'Kronoberg', lat: 56.8, lon: 14.5 },
      { nome: 'Norrbotten', lat: 66.8, lon: 20.0 },
      { nome: 'Örebro', lat: 59.4, lon: 15.0 },
      { nome: 'Östergötland', lat: 58.4, lon: 15.6 },
      { nome: 'Scania', lat: 55.9, lon: 13.6 },
      { nome: 'Södermanland', lat: 59.1, lon: 16.7 },
      { nome: 'Stoccolma', lat: 59.3, lon: 18.1 },
      { nome: 'Uppsala', lat: 60.0, lon: 17.5 },
      { nome: 'Värmland', lat: 59.7, lon: 13.4 },
      { nome: 'Västerbotten', lat: 64.7, lon: 18.5 },
      { nome: 'Västernorrland', lat: 63.0, lon: 17.5 },
      { nome: 'Västmanland', lat: 59.7, lon: 16.2 },
      { nome: 'Västra Götaland', lat: 58.3, lon: 12.8 },
    ],
  },
  { id: 'dk', nome: 'Danimarca', continente: 'europa', lat: 56.0, lon: 10.0, area: 'Regione',
    aree: [
      { nome: 'Hovedstaden', lat: 55.8, lon: 12.3 },
      { nome: 'Sjælland', lat: 55.4, lon: 11.8 },
      { nome: 'Syddanmark', lat: 55.4, lon: 9.4 },
      { nome: 'Midtjylland', lat: 56.3, lon: 9.5 },
      { nome: 'Nordjylland', lat: 57.1, lon: 9.9 },
    ],
  },
  { id: 'gr', nome: 'Grecia', continente: 'europa', lat: 39.0, lon: 22.0 },
  { id: 'ro', nome: 'Romania', continente: 'europa', lat: 45.9, lon: 25.0 },
  { id: 'ma', nome: 'Marocco', continente: 'africa', lat: 31.8, lon: -7.1 },
  { id: 'tn', nome: 'Tunisia', continente: 'africa', lat: 34.0, lon: 9.6 },
  { id: 'eg', nome: 'Egitto', continente: 'africa', lat: 26.8, lon: 30.8 },
  { id: 'ng', nome: 'Nigeria', continente: 'africa', lat: 9.1, lon: 8.7 },
  { id: 'ke', nome: 'Kenya', continente: 'africa', lat: 0.0, lon: 37.9 },
  { id: 'za', nome: 'Sudafrica', continente: 'africa', lat: -29.0, lon: 24.0 },
  { id: 'ae', nome: 'Emirati Arabi Uniti', continente: 'asia', lat: 24.0, lon: 54.0 },
  { id: 'il', nome: 'Israele', continente: 'asia', lat: 31.4, lon: 35.0 },
  { id: 'tr', nome: 'Turchia', continente: 'asia', lat: 39.0, lon: 35.2 },
  { id: 'in', nome: 'India', continente: 'asia', lat: 22.0, lon: 79.0 },
  { id: 'cn', nome: 'Cina', continente: 'asia', lat: 35.0, lon: 104.0 },
  { id: 'jp', nome: 'Giappone', continente: 'asia', lat: 36.2, lon: 138.3 },
  { id: 'sg', nome: 'Singapore', continente: 'asia', lat: 1.35, lon: 103.8 },
  { id: 'us', nome: 'Stati Uniti', continente: 'nordamerica', lat: 39.8, lon: -98.6, area: 'Stato',
    aree: [
      { nome: 'Alabama', lat: 32.8, lon: -86.8 },
      { nome: 'Alaska', lat: 64.0, lon: -152.0 },
      { nome: 'Arizona', lat: 34.3, lon: -111.7 },
      { nome: 'Arkansas', lat: 34.9, lon: -92.4 },
      { nome: 'California', lat: 37.2, lon: -119.5 },
      { nome: 'Carolina del Nord', lat: 35.5, lon: -79.4 },
      { nome: 'Carolina del Sud', lat: 33.9, lon: -80.9 },
      { nome: 'Colorado', lat: 39.0, lon: -105.5 },
      { nome: 'Connecticut', lat: 41.6, lon: -72.7 },
      { nome: 'Dakota del Nord', lat: 47.4, lon: -100.5 },
      { nome: 'Dakota del Sud', lat: 44.4, lon: -100.2 },
      { nome: 'Delaware', lat: 39.0, lon: -75.5 },
      { nome: 'Distretto di Columbia', lat: 38.9, lon: -77.0 },
      { nome: 'Florida', lat: 28.6, lon: -82.4 },
      { nome: 'Georgia', lat: 32.6, lon: -83.4 },
      { nome: 'Hawaii', lat: 20.3, lon: -156.4 },
      { nome: 'Idaho', lat: 44.4, lon: -114.6 },
      { nome: 'Illinois', lat: 40.0, lon: -89.2 },
      { nome: 'Indiana', lat: 39.9, lon: -86.3 },
      { nome: 'Iowa', lat: 42.1, lon: -93.5 },
      { nome: 'Kansas', lat: 38.5, lon: -98.4 },
      { nome: 'Kentucky', lat: 37.5, lon: -85.3 },
      { nome: 'Louisiana', lat: 31.1, lon: -92.0 },
      { nome: 'Maine', lat: 45.4, lon: -69.2 },
      { nome: 'Maryland', lat: 39.0, lon: -76.8 },
      { nome: 'Massachusetts', lat: 42.3, lon: -71.8 },
      { nome: 'Michigan', lat: 44.3, lon: -85.4 },
      { nome: 'Minnesota', lat: 46.3, lon: -94.3 },
      { nome: 'Mississippi', lat: 32.7, lon: -89.7 },
      { nome: 'Missouri', lat: 38.4, lon: -92.5 },
      { nome: 'Montana', lat: 47.0, lon: -109.6 },
      { nome: 'Nebraska', lat: 41.5, lon: -99.8 },
      { nome: 'Nevada', lat: 39.3, lon: -116.6 },
      { nome: 'New Hampshire', lat: 43.7, lon: -71.6 },
      { nome: 'New Jersey', lat: 40.2, lon: -74.7 },
      { nome: 'New Mexico', lat: 34.4, lon: -106.1 },
      { nome: 'New York', lat: 42.9, lon: -75.5 },
      { nome: 'Ohio', lat: 40.3, lon: -82.8 },
      { nome: 'Oklahoma', lat: 35.6, lon: -97.5 },
      { nome: 'Oregon', lat: 43.9, lon: -120.6 },
      { nome: 'Pennsylvania', lat: 40.9, lon: -77.8 },
      { nome: 'Rhode Island', lat: 41.7, lon: -71.6 },
      { nome: 'Tennessee', lat: 35.8, lon: -86.4 },
      { nome: 'Texas', lat: 31.5, lon: -99.3 },
      { nome: 'Utah', lat: 39.3, lon: -111.7 },
      { nome: 'Vermont', lat: 44.1, lon: -72.7 },
      { nome: 'Virginia', lat: 37.5, lon: -78.9 },
      { nome: 'Virginia Occidentale', lat: 38.6, lon: -80.6 },
      { nome: 'Washington', lat: 47.4, lon: -120.5 },
      { nome: 'Wisconsin', lat: 44.6, lon: -89.7 },
      { nome: 'Wyoming', lat: 43.0, lon: -107.6 },
    ],
  },
  { id: 'ca', nome: 'Canada', continente: 'nordamerica', lat: 56.1, lon: -106.3, area: 'Provincia',
    aree: [
      { nome: 'Alberta', lat: 54.5, lon: -114.4 },
      { nome: 'Columbia Britannica', lat: 53.7, lon: -125.0 },
      { nome: 'Manitoba', lat: 53.8, lon: -98.8 },
      { nome: 'Nuovo Brunswick', lat: 46.5, lon: -66.3 },
      { nome: 'Terranova e Labrador', lat: 53.1, lon: -59.0 },
      { nome: 'Nuova Scozia', lat: 45.0, lon: -63.0 },
      { nome: 'Ontario', lat: 50.0, lon: -85.0 },
      { nome: 'Isola del Principe Edoardo', lat: 46.4, lon: -63.2 },
      { nome: 'Quebec', lat: 52.9, lon: -71.9 },
      { nome: 'Saskatchewan', lat: 54.4, lon: -105.9 },
      { nome: 'Territori del Nord-Ovest', lat: 64.8, lon: -119.5 },
      { nome: 'Nunavut', lat: 70.3, lon: -83.1 },
      { nome: 'Yukon', lat: 63.4, lon: -135.0 },
    ],
  },
  { id: 'mx', nome: 'Messico', continente: 'nordamerica', lat: 23.6, lon: -102.5 },
  { id: 'br', nome: 'Brasile', continente: 'sudamerica', lat: -14.2, lon: -51.9 },
  { id: 'ar', nome: 'Argentina', continente: 'sudamerica', lat: -38.4, lon: -63.6 },
  { id: 'cl', nome: 'Cile', continente: 'sudamerica', lat: -35.7, lon: -71.5 },
  { id: 'co', nome: 'Colombia', continente: 'sudamerica', lat: 4.6, lon: -74.3 },
  { id: 'au', nome: 'Australia', continente: 'oceania', lat: -25.3, lon: 133.8 },
  { id: 'nz', nome: 'Nuova Zelanda', continente: 'oceania', lat: -41.0, lon: 174.9 },
];

export const continenteById = (id) => CONTINENTI.find((c) => c.id === id) || null;
export const paeseById = (id) => PAESI.find((p) => p.id === id) || null;
export const paesiDi = (continente) => PAESI.filter((p) => p.continente === continente);
export const areeDi = (paeseId) => paeseById(paeseId)?.aree || [];
export const areaDiPaese = (paeseId, nome) => areeDi(paeseId).find((a) => a.nome === nome) || null;

/** Come si chiama il terzo livello in quel paese: "Regione", "Cantone", "Stato". */
export const nomeLivelloArea = (paeseId) => paeseById(paeseId)?.area || 'Area';

/** Una zona scritta come si legge: "Italia · Lombardia", "Europa". */
export function nomeZona({ continente, paese, area } = {}) {
  const pezzi = [];
  if (paese) pezzi.push(paeseById(paese)?.nome || paese);
  else if (continente) pezzi.push(continenteById(continente)?.nome || continente);
  if (area) pezzi.push(area);
  return pezzi.join(' \u00b7 ') || '\u2014';
}

/**
 * Una zona dichiarata copre quella cercata?
 *
 * Chi dice "Europa" e' disponibile anche per l'Italia; chi dice "Italia" non
 * e' disponibile per la Francia. La disponibilita' e' larga, la ricerca e'
 * stretta, e il confronto va fatto in quel verso — al contrario si
 * perderebbero proprio i profili piu' disposti a spostarsi.
 */
export function zonaCopre(dichiarata, cercata) {
  if (!cercata || (!cercata.continente && !cercata.paese && !cercata.area)) return true;
  if (cercata.continente && dichiarata.continente !== cercata.continente) return false;
  // Chi non ha indicato il paese si e' dichiarato per tutto il continente.
  if (cercata.paese && dichiarata.paese && dichiarata.paese !== cercata.paese) return false;
  if (cercata.area && dichiarata.area && dichiarata.area !== cercata.area) return false;
  return true;
}

/**
 * Il centro di una zona dichiarata, dal piu' preciso al piu' largo.
 *
 * Serve a chi non ha dato il permesso di leggere la posizione: la sua
 * distanza si misura dal centro di quello che ha dichiarato. E' grossolana e
 * si dichiara grossolana, ma permette di comparire in una ricerca per
 * distanza senza dover cedere niente in piu'.
 */
export function centroZona({ continente, paese, area } = {}) {
  if (paese && area) {
    const trovata = areaDiPaese(paese, area);
    if (trovata) return { lat: trovata.lat, lon: trovata.lon, precisione: 'area' };
  }
  const p = paeseById(paese);
  if (p) return { lat: p.lat, lon: p.lon, precisione: 'paese' };
  const c = continenteById(continente);
  if (c) return { lat: c.lat, lon: c.lon, precisione: 'continente' };
  return null;
}

/**
 * Le lingue. Anche queste sono un elenco di partenza, con dentro quelle che
 * si incontrano davvero in un annuncio di lavoro europeo.
 */
export const LINGUE = [
  { id: 'it', nome: 'Italiano' },
  { id: 'en', nome: 'Inglese' },
  { id: 'fr', nome: 'Francese' },
  { id: 'de', nome: 'Tedesco' },
  { id: 'es', nome: 'Spagnolo' },
  { id: 'pt', nome: 'Portoghese' },
  { id: 'nl', nome: 'Olandese' },
  { id: 'pl', nome: 'Polacco' },
  { id: 'ro', nome: 'Rumeno' },
  { id: 'ru', nome: 'Russo' },
  { id: 'ar', nome: 'Arabo' },
  { id: 'zh', nome: 'Cinese' },
  { id: 'ja', nome: 'Giapponese' },
  { id: 'hi', nome: 'Hindi' },
];

export const linguaById = (id) => LINGUE.find((l) => l.id === id) || null;
