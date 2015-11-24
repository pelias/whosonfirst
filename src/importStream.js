var event_stream = require('event-stream');
var map_stream = require('through2-map');

var Document = require('pelias-model').Document;
var createPeliasElasticsearchPipeline = require('./elasticsearchPipeline');

function fullImport(records) {
  var id_stream = event_stream.readArray(Object.keys(records));

  var object_getter_stream = map_stream.obj(function(id) {
    return records[id];
  });

  var document_stream = map_stream.obj(function(record) {
    // console.log('starting ' + record.id + ': ' + record.name);

    var wofDoc = new Document( 'whosonfirst', record.id );
    if (record.name) {
      wofDoc.setName('default', record.name);
    }
    wofDoc.setCentroid({ lat: record.lat, lon: record.lon });

    // walk up parent_id's, there's probably a more node-y way to do this
    var parent_id = record.parent_id;

    while (parent_id !== 0 && parent_id !== -1 && records[parent_id] !== undefined) {
      var parent = records[parent_id];

      if (parent.placetype === 'locality') {
        wofDoc.setAdmin( 'locality', parent.name)
      }
      else if (parent.placetype === 'county') {
        wofDoc.setAdmin( 'admin2', parent.name)
      }
      else if (parent.placetype === 'region') {
        wofDoc.setAdmin( 'admin1', parent.name)
      }
      else if (parent.placetype === 'country') {
        wofDoc.setAdmin( 'admin0', parent.name)
      }

      parent_id = parent.parent_id;

    }

    return wofDoc;
  });

  id_stream.pipe(object_getter_stream)
  .pipe(document_stream)
  .pipe(createPeliasElasticsearchPipeline());
}

module.exports = fullImport;
