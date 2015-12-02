var event_stream = require('event-stream');
var map_stream = require('through2-map');
var spy_stream = require('through2-spy');
var _ = require('lodash');

var Document = require('pelias-model').Document;
var peliasLogger = require( 'pelias-logger' );
var createPeliasElasticsearchPipeline = require('./elasticsearchPipeline');

function fullImport(records) {
  var id_stream = event_stream.readArray(Object.keys(records));

  var logger = peliasLogger.get( 'whosonfirst', {
    transports: [
      new peliasLogger.winston.transports.File( {
        filename: 'missing_countries.txt',
        timestamp: false
      })
    ]
  });

  var object_getter_stream = map_stream.obj(function(id) {
    return records[id];
  });

  var has_country_validation_stream = spy_stream.obj(function(wofDoc) {
    if (_.isUndefined(wofDoc.getAdmin('admin0'))) {
      logger.warn(wofDoc.getId());
    }

  });

  // helper for filtering array of parents to just those with names
  var has_name = function(r) {
    return r.name;
  }

  var document_stream = map_stream.obj(function(record) {
    var wofDoc = new Document( 'whosonfirst', record.id );
    if (record.name) {
      wofDoc.setName('default', record.name);
    }
    wofDoc.setCentroid({ lat: record.lat, lon: record.lon });

    // collect all the defined parents, starting with the current record
    var parents = [];
    var parent_id = record.id;
    while (!_.isUndefined(records[parent_id])) {
      var parent = records[parent_id];
      parents.push(parent);
      parent_id = parent.parent_id;
    }

    // iterate parents, assigning fields appropriately
    parents.filter(has_name).forEach(function(parent) {
      if (parent.place_type === 'locality') {
        wofDoc.setAdmin( 'locality', parent.name)
      }
      else if (parent.place_type === 'county') {
        wofDoc.setAdmin( 'admin2', parent.name)
      }
      else if (parent.place_type === 'region') {
        wofDoc.setAdmin( 'admin1', parent.name)
      }
      else if (parent.place_type === 'country') {
        wofDoc.setAdmin( 'admin0', parent.name);
      }

    });

    return wofDoc;

  });

  id_stream.pipe(object_getter_stream)
  .pipe(document_stream)
  .pipe(has_country_validation_stream)
  .pipe(createPeliasElasticsearchPipeline());
}

module.exports = fullImport;
