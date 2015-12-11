var readStream = require('./src/readStream');
var importStream = require('./src/importStream');
var createPeliasElasticsearchPipeline = require('./src/elasticsearchPipeline');
var peliasDocGenerators = require('./src/peliasDocGenerators');
var wofRecordStream = require('./src/wofRecordStream');

var directory = '../../whosonfirst/whosonfirst-data/';

var types = [
  'continent',
  'country',
  'county',
  'dependency',
  'disputed',
  'empire',
  'localadmin',
  'locality',
  'macrocounty',
  'macrohood',
  'macroregion',
  'metroarea',
  'microhood',
  'neighbourhood',
  'region'
];

var wofRecords = {};

readStream(directory, types, wofRecords, function() {
  console.log(Object.keys(wofRecords).length + ' records loaded');

  // a stream of WOF records
  var recordStream = wofRecordStream.createWofRecordsStream(wofRecords);

  // how to convert WOF records to Pelias Documents
  var documentGenerator = peliasDocGenerators.parent_id_walker(wofRecords);

  // the final destination of Pelias Documents
  var elasticsearchPipeline = createPeliasElasticsearchPipeline();

  // import WOF records into ES
  importStream(recordStream, documentGenerator, elasticsearchPipeline, function() {
    console.log('import finished');
  });

});
