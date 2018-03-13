
const async = require('async');
const _ = require('lodash');
const logger = require('pelias-logger').get('download_data_filtered');
const config = require( 'pelias-config' ).generate(require('../../schema'));

const getParents = require('./getParents').getParents;
const getDescendants = require('./getDescendants').getDescendants;
const generateMetafiles = require('./generateMetafiles').generateMetafiles;
const downloadPlaces = require('./downloadPlaces').downloadPlaces;


// some sample WOF ids to filter by
// const NewJersey = '85688607';
// const Berlin = '101748799';

function download(callback) {

  // array support for 'importPlace' was added after this downloader was written.
  // backwards compatibility support since the schema validation changed to support arrays.
  if( Array.isArray( config.imports.whosonfirst.importPlace ) ){
    console.error('this download method only supports a single entry for whosonfirst.importPlace');
    config.imports.whosonfirst.importPlace = config.imports.whosonfirst.importPlace[0];
    console.error('only using the first value in the array:', config.imports.whosonfirst.importPlace );
  }

  const context = {
    apiKey: config.imports.whosonfirst.api_key,
    // path to data directory where the data will be downloaded to, it will be created if doesn't exist
    targetDir: config.imports.whosonfirst.datapath,
    // id to be used for filtering the data
    placeId: config.imports.whosonfirst.importPlace,
    // to be filled in by getPlaceById()
    placeInfo: null,
    // to be filled in by getDescendants() and getParents() and will look like { region: [array of place info objects {}, {}, {}]
    places: {}
  };

  async.waterfall(
    [
      // get a breakdown of all the parents and basic info
      // (enough to generate the meta files without loading each record's full json file)
      getParents.bind(null, context),
      // get a breakdown of all the descendants and basic info
      // (enough to generate the meta files without loading each record's full json file)
      getDescendants.bind(null, context),
      // generate meta files
      generateMetafiles.bind(null, context),
      // download all the descendant records
      downloadPlaces.bind(null, context)
    ],
    (err) => {
      if (err) {
        return logger.error(err.message || JSON.stringify(err, null, 2));
      }

      _.each(context.places, (places, placetype) => {
        logger.info(`downloaded ${places.length} ${placetype} records`);
      });

      callback();
    }
  );
}

module.exports.download = download;
