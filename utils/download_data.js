
const config = require( 'pelias-config' ).generate(require('../schema')).imports.whosonfirst;

let isoCodePlaces = null;

function on_done() {
  console.log('All done!');
}

if( config.importPlace ) {
  const countryIsoCodeRegex = /^((US|us)-){0,1}([A-z]{2})$/;
  isoCodePlaces = Array.isArray(config.importPlace) ? config.importPlace: [config.importPlace];
  isoCodePlaces = isoCodePlaces.filter(code => countryIsoCodeRegex.test(code)).map(code => code.toLowerCase());
}


if( isoCodePlaces !== null && isoCodePlaces.length > 0 ) {
  const download = require('./sqlite_download').download;
  const extract = require('./sqlite_extract_data').extract;

  let databases = [];
  isoCodePlaces.forEach( country => {

    if(country.includes('us')) {
      if( true === config.importVenues ) {
        databases.push(`whosonfirst-data-venue-${country}-latest.db`);
      }
      if( true === config.importIntersections ) {
        databases.push(`whosonfirst-data-intersection-${country}-latest.db`);
      }
    } else {
      if( true === config.importPostalcodes ){
        databases.push(`whosonfirst-data-postalcode-${country}-latest.db`);
      }
      if( true === config.importConstituencies ){
        databases.push(`whosonfirst-data-constituency-${country}-latest.db`);
      }
    }

  });

    // download additonal database files
    download({ databases: databases }, () => {

      // extract all files
      console.error('extracting data...');
      extract({
        unlink: true,
        databases
      }, on_done);
    });

}
else {
  if ( config.sqlite ) {
    require('./download_sqlite_all').download(on_done);
  } else {
    require('./download_data_all').download(on_done);
  }
}
