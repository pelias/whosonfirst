var peliasConfig = require( 'pelias-config' ).generate();
var readStreamModule = require('./src/readStream');
var importStream = require('./src/importStream');
var peliasDbclient = require( 'pelias-dbclient' );
var peliasDocGenerators = require('./src/peliasDocGenerators');
var hierarchyFinder = require('./src/hierarchyFinder');
var checker = require('node-version-checker').default;
var bundles = require('./src/bundleList');

function hasDataDirectory() {
  return peliasConfig.imports.hasOwnProperty('whosonfirst') &&
          peliasConfig.imports.whosonfirst.hasOwnProperty('datapath');
}

checker();

if (!hasDataDirectory()) {
  console.error('Could not find whosonfirst data directory in configuration');
  process.exit( 2 );
}

var directory = peliasConfig.imports.whosonfirst.datapath;

if (directory.slice(-1) !== '/') {
  directory = directory + '/';
}

// a cache of only admin records, to be used to fill the hierarchy
// of other, lower admin records as well as venues
var wofAdminRecords = {};

var bundlesToImport = bundles.hierarchyBundles;

if (peliasConfig.imports.whosonfirst.importVenues) {
  bundlesToImport = bundlesToImport.concat(bundles.venueBundles);
}

var readStream = readStreamModule.create(directory, bundlesToImport, wofAdminRecords);

// how to convert WOF records to Pelias Documents
var documentGenerator = peliasDocGenerators.create(
  hierarchyFinder.hierarchies_walker(wofAdminRecords));

// the final destination of Pelias Documents
var dbClientStream = peliasDbclient();

// import WOF records into ES
importStream(readStream, documentGenerator, dbClientStream, function() {
  console.log('import finished');
});
