
const config = require( 'pelias-config' ).generate(require('../schema')).imports.whosonfirst;

function on_done() {
  console.log('All done!');
}

let mainDbsToDownload = [];
if( config.isoCountryCodes ) {
  const countryIsoCodeRegex = /^([A-z]{2})$/;
  let isoCountryCodes = Array.isArray(config.isoCountryCodes) ? config.isoCountryCodes: [config.isoCountryCodes];
  isoCountryCodes = isoCountryCodes.filter(code => countryIsoCodeRegex.test(code)).map(code => code.toLowerCase());
  isoCountryCodes.forEach(code => {
    mainDbsToDownload.push(`whosonfirst-data-admin-${code}-latest.db`);
    if( true === config.importPostalcodes ){
      mainDbsToDownload.push(`whosonfirst-data-postalcode-${code}-latest.db`);
    }  
    if( true === config.importConstituencies ){
      mainDbsToDownload.push(`whosonfirst-data-constituency-${code}-latest.db`);
    }
  });
} 

if(config.isoCountryCodes === null || mainDbsToDownload.length === 0) {
  mainDbsToDownload = [ 'whosonfirst-data-admin-latest.db' ];
  if( true === config.importPostalcodes ){
    mainDbsToDownload.push('whosonfirst-data-postalcode-latest.db');
  }  
  if( true === config.importConstituencies ){
    mainDbsToDownload.push('whosonfirst-data-constituency-latest.db');
  }
}

console.log('will download:');
console.log(mainDbsToDownload);


const download = require('./sqlite_download').download;
const extract = require('./sqlite_extract_data').extract;

// download main sqlite database file
download({ databases: mainDbsToDownload }, () => {

        // extract all files
        console.error('extracting data...');
        extract({
          unlink: true,
          databases: mainDbsToDownload
        }, on_done);

});
