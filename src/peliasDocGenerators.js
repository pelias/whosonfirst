var map_stream = require('through2-map');
var _ = require('lodash');
var Document = require('pelias-model').Document;

module.exports = {};

module.exports.parent_id_walker = function(records) {
  return map_stream.obj(function(record) {
    var wofDoc = new Document( 'whosonfirst', record.id );
    if (record.name) {
      wofDoc.setName('default', record.name);
    }
    wofDoc.setCentroid({ lat: record.lat, lon: record.lon });

    // WOF bbox is defined as:
    // lowerLeft.lon, lowerLeft.lat, upperRight.lon, upperRight.lat
    if (!_.isUndefined(record.bounding_box)) {
      var parsedBoundingBox = record.bounding_box.split(',').map(parseFloat);
      var marshaledBoundingBoxBox = {
        upperLeft: {
          lat: parsedBoundingBox[3],
          lon: parsedBoundingBox[0]
        },
        lowerRight: {
          lat: parsedBoundingBox[1],
          lon: parsedBoundingBox[2]
        }

      };
      wofDoc.setBoundingBox(marshaledBoundingBoxBox);
    }

    // collect all the defined parents, starting with the current record
    var parents = [];
    var parent_id = record.id;
    while (!_.isUndefined(records[parent_id])) {
      var parent = records[parent_id];
      parents.push(parent);
      parent_id = parent.parent_id;
    }

    // iterate parents, assigning fields appropriately
    parents.filter(function(r) { return r.name; } ).forEach(function(parent) {
      if (parent.place_type === 'locality') {
        wofDoc.setAdmin( 'locality', parent.name);
      }
      else if (parent.place_type === 'county') {
        wofDoc.setAdmin( 'admin2', parent.name);
      }
      else if (parent.place_type === 'region') {
        wofDoc.setAdmin( 'admin1', parent.name);
      }
      else if (parent.place_type === 'country') {
        wofDoc.setAdmin( 'admin0', parent.name);
      }

    });

    return wofDoc;

  });

};
