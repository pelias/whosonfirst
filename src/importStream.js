var stream_array = require('stream-array');
var map_stream = require('through2-map');

var peliasModel = require('pelias-model');
var Document = require('pelias-model').Document;
var createPeliasElasticsearchPipeline = require('./elasticsearchPipeline');

function fullImport(records) {
  var id_stream = stream_array(Object.keys(records));

  var object_getter_stream = map_stream.obj(function(id) {
    return records[id];
  });

  var document_stream = map_stream.obj(function(record) {
    var wofDoc = new peliasModel.Document( 'whosonfirst', record.id );
    if (record.name) {
      wofDoc.setName('default', record.name);
    }
    wofDoc.setCentroid({ lat: record.lat, lon: record.lon});

    return wofDoc;
  });

  id_stream.pipe(object_getter_stream)
  .pipe(document_stream)
  .pipe(createPeliasElasticsearchPipeline());
}

module.exports = fullImport;
