
const config = require( 'pelias-config' ).generate(require('../schema')).imports.whosonfirst;

function on_done() {
  console.log('All done!');
}

if( config.importPlace ) {
  const download = require('./sqlite_download').download;
  const extract = require('./sqlite_extract_data').extract;
  const findSubdivisions = require('./sqlite_extract_data').findSubdivisions;
  const databases = [ 'whosonfirst-data-latest.db' ];

  // download main sqlite database file
  download({ databases: databases }, () => {

    // enumerate additional sqlite databases required
    const subdivisions = findSubdivisions( 'whosonfirst-data-latest.db' );
    subdivisions.forEach( subdivision => {
      let parts = subdivision.split('-');
      if( parts.length > 1 ){
        if( true === config.importVenues ){
          if( 'us' === parts[0] ){
            databases.push(`whosonfirst-data-venue-${subdivision}-latest.db`);
          } else {
            console.error(`whosonfirst-data-venue-${parts[0]}-latest.db`);
          }
        }
      }
      else {
        if( true === config.importPostalcodes ){
          databases.push(`whosonfirst-data-postalcode-${subdivision}-latest.db`);
        }
        if( true === config.importConstituencies ){
          databases.push(`whosonfirst-data-constituency-${subdivision}-latest.db`);
        }
        if( true === config.importIntersections ){
          databases.push(`whosonfirst-data-intersection-${subdivision}-latest.db`);
        }
      }
    });

    // download additonal database files
    download({ databases: databases }, () => {

      // extract all files
      extract({ unlink: true, databases: databases }, on_done);
    });
  });
}
else {
  require('./download_data_all').download(on_done);
}
