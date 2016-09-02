var peliasConfig = require( 'pelias-config' ).generate();
var readStreamModule = require('./src/readStream');
var importStream = require('./src/importStream');
var peliasDbclient = require( 'pelias-dbclient' );
var peliasDocGenerators = require('./src/peliasDocGenerators');
var hierarchyFinder = require('./src/hierarchyFinder');
var checker = require('node-version-checker').default;

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

// types must be in highest to lowest level order
// see https://github.com/whosonfirst/whosonfirst-placetypes
// venue data goes last
var types = [
  'continent',
  'country',
  'dependency',
  'disputed',
  'macroregion',
  'region',
  'macrocounty',
  'county',
  'localadmin',
  'locality',
  'borough',
  'neighbourhood',
  'venue-tr',
  'venue-in',
  'venue-ru',
  'venue-au',
  'venue-ca',
  'venue-ch',
  'venue-de',
  'venue-dk',
  'venue-es',
  'venue-fr',
  'venue-gb',
  'venue-it',
  'venue-mx',
  'venue-nl',
  'venue-nz',
  'venue-us-in',
  'venue-us-ca',
  'venue-us-mn',
  'venue-us-al',
  'venue-us-ar',
  'venue-us-md',
  'venue-us-co',
  'venue-us-pa',
  'venue-us-ct',
  'venue-us-de',
  'venue-us-dc',
  'venue-us-hi',
  'venue-us-ne',
  'venue-us-ma',
  'venue-us-va',
  'venue-us-id',
  'venue-us-ia',
  'venue-us-az',
  'venue-us-tn',
  'venue-us-ks',
  'venue-us-ky',
  'venue-us-la',
  'venue-us-ms',
  'venue-us-ok',
  'venue-us-ri',
  'venue-us-mo',
  'venue-us-nc',
  'venue-us-oh',
  'venue-us-wi',
  'venue-us-mt',
  'venue-us-ak',
  'venue-us-nv',
  'venue-us-nh',
  'venue-us-nm',
  'venue-us-nd',
  'venue-us-fl',
  'venue-us-mi',
  'venue-us-me',
  'venue-us-wa',
  'venue-us-ga',
  'venue-us-tx',
  'venue-us-sc',
  'venue-us-sd',
  'venue-us-ut',
  'venue-us-vt',
  'venue-us-nj',
  'venue-us-wv',
  'venue-us-il',
  'venue-us-or',
  'venue-us-wy',
  'venue-us-ny'
];

// a cache of only admin records, to be used to fill the hierarchy
// of other, lower admin records as well as venues
var wofAdminRecords = {};

var readStream = readStreamModule.create(directory, types, wofAdminRecords);

// how to convert WOF records to Pelias Documents
var documentGenerator = peliasDocGenerators.create(
  hierarchyFinder.hierarchies_walker(wofAdminRecords));

// the final destination of Pelias Documents
var dbClientStream = peliasDbclient();

// import WOF records into ES
importStream(readStream, documentGenerator, dbClientStream, function() {
  console.log('import finished');
});
