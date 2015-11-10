var event_stream = require('event-stream');
var map_stream = require('through2-map');

var peliasModel = require('pelias-model');
var Document = require('pelias-model').Document;
var createPeliasElasticsearchPipeline = require('./elasticsearchPipeline');

function fullImport(records) {
  var id_stream = event_stream.readArray(Object.keys(records));

  var object_getter_stream = map_stream.obj(function(id) {
    return records[id];
  });

  var document_stream = map_stream.obj(function(record) {
    var wofDoc = new peliasModel.Document( 'whosonfirst', record.id );
    if (record.name) {
      wofDoc.setName('default', record.name);
    }
    wofDoc.setCentroid({ lat: record.lat, lon: record.lon});

    // it is possible for a WOF record to lack hierarchy, see:
    //  https://whosonfirst.mapzen.com/spelunker/id/101747771/
    //  https://whosonfirst.mapzen.com/spelunker/id/85687219/
    if (!record.hierarchy) {
      return wofDoc;
    }

    var country_id = record.hierarchy.country_id;

    if (records[country_id]) {
      wofDoc.setAdmin( 'admin0', records[country_id].name);
    }

    if (record.placetype === 'neighbourhood') {
      // set city, if available
      if (hasProperty(records, record.hierarchy, 'locality_id')) {
        wofDoc.setAdmin( 'locality', records[record.hierarchy.locality_id].name)
      }

      // set county, if available
      if (hasProperty(records, record.hierarchy, 'county_id')) {
        wofDoc.setAdmin( 'admin2', records[record.hierarchy.county_id].name)
      }

      // set region, if available
      if (hasProperty(records, record.hierarchy, 'region_id')) {
        wofDoc.setAdmin( 'admin1', records[record.hierarchy.region_id].name)
      }

    }
    else if (record.placetype === 'locality') {
      // set county, if available
      if (hasProperty(records, record.hierarchy, 'county_id')) {
        wofDoc.setAdmin( 'admin2', records[record.hierarchy.county_id].name)
      }

      // set region, if available
      if (hasProperty(records, record.hierarchy, 'region_id')) {
        wofDoc.setAdmin( 'admin1', records[record.hierarchy.region_id].name)
      }

    }
    else if (record.placetype === 'county') {
      // set region, if available
      if (hasProperty(records, record.hierarchy, 'region_id')) {
        wofDoc.setAdmin( 'admin1', records[record.hierarchy.region_id].name)
      }

    }

    return wofDoc;
  });

  id_stream.pipe(object_getter_stream)
  .pipe(document_stream)
  .pipe(createPeliasElasticsearchPipeline());
}

function hasProperty(records, hierarchy, property) {
  return hierarchy.hasOwnProperty(property) &&
          records[hierarchy[property]] &&
          records[hierarchy[property]].name;
}

module.exports = fullImport;
