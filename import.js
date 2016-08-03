var peliasConfig = require( 'pelias-config' ).generate();
var readStream = require('./src/readStream');
var importStream = require('./src/importStream');
var peliasDbclient = require( 'pelias-dbclient' );
var peliasDocGenerators = require('./src/peliasDocGenerators');
var wofRecordStream = require('./src/wofRecordStream');
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
  'county',
  'macrocounty',
  'localadmin',
  'locality',
  'borough',
  'neighbourhood'
];

var wofRecords = {};

readStream(directory, types, wofRecords, function() {
  console.log(Object.keys(wofRecords).length + ' records loaded');

  // a stream of WOF records
  var recordStream = wofRecordStream.createWofRecordsStream(wofRecords);

  // how to convert WOF records to Pelias Documents
  var documentGenerator = peliasDocGenerators.create(
    hierarchyFinder.hierarchies_walker(wofRecords));

  // the final destination of Pelias Documents
  var dbClientStream = peliasDbclient();

  // import WOF records into ES
  importStream(recordStream, documentGenerator, dbClientStream, function() {
    console.log('import finished');
  });

});
