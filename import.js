var readStream = require('./src/readStream');
var importStream = require('./src/importStream');
var createPeliasElasticsearchPipeline = require('./src/elasticsearchPipeline');

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

  importStream(wofRecords, createPeliasElasticsearchPipeline(), function() {
      console.log('finished');
  });

});
