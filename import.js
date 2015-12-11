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

  var recordStream = wofRecordStream.createWofRecordsStream(wofRecords);
  var documentGenerator = peliasDocGenerators.parent_id_walker(wofRecords);
  var elasticsearchPipeline = createPeliasElasticsearchPipeline();

  importStream(recordStream, documentGenerator, elasticsearchPipeline, function() {
      console.log('import finished');
  });

});
