var peliasConfig = require( 'pelias-config' ).generate();
var readStream = require('./src/readStream');
var importStream = require('./src/importStream');
var peliasDbclient = require( 'pelias-dbclient' );
var peliasDocGenerators = require('./src/peliasDocGenerators');
var wofRecordStream = require('./src/wofRecordStream');
var hierarchyFinder = require('./src/hierarchyFinder');

function hasDataDirectory() {
  return peliasConfig.imports.hasOwnProperty('whosonfirst') &&
          peliasConfig.imports.whosonfirst.hasOwnProperty('datapath');
}

if (!hasDataDirectory()) {
  console.error('Could not find whosonfirst data directory in configuration');
  process.exit( 2 );
}

var directory = peliasConfig.imports.whosonfirst.datapath;

if (directory.slice(-1) !== '/') {
  directory = directory + '/';
}

var types = [
  'borough',
  'continent',
  'country',
  'county',
  'dependency',
  'disputed',
  'localadmin',
  'locality',
  'macrocounty',
  'macroregion',
  'neighbourhood',
  'region'
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
