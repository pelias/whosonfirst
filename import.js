require ('./global_const');

var peliasConfig = require( 'pelias-config' ).generate(require('./schema'));
var readStreamModule = require('./src/readStream');
var importStream = require('./src/importStream');
var peliasDbclient = require( 'pelias-dbclient' );
var peliasDocGenerators = require('./src/peliasDocGenerators');
var hierarchyFinder = require('./src/hierarchyFinder');
var bundles = require('./src/bundleList');

const logger = require( 'pelias-logger' ).get( 'whosonfirst' );

logger.info(`The importer is being run with polygon data ${global.geo_shape_polygon}`);

// a cache of only admin records, to be used to fill the hierarchy
// of other, lower admin records as well as venues
var wofAdminRecords = {};

bundles.generateBundleList((err, bundlesToImport) => {

  if (err) {
    throw new Error(err.message);
  }

  // This can be either csv or db files, the read stream module will do the job
  const bundlesFiles = bundlesToImport.map( (bundle) => { return bundle.replace('.tar.bz2', '.csv'); });

  const readStream = readStreamModule.create(
    peliasConfig.imports.whosonfirst,
    bundlesFiles,
    wofAdminRecords);

  // how to convert WOF records to Pelias Documents
  var documentGenerator = peliasDocGenerators.create(hierarchyFinder(wofAdminRecords));

  // the final destination of Pelias Documents
  var dbClientStream = peliasDbclient({name: 'whosonfirst'});

  // import WOF records into ES
  importStream(readStream, documentGenerator, dbClientStream, function () {
    logger.info('import finished');
  });
});
