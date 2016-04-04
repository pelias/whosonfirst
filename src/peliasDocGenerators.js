var map_stream = require('through2-map');
var _ = require('lodash');
var iso3166 = require('iso3166-1');

var Document = require('pelias-model').Document;

module.exports = {};

module.exports.create = function(hierarchy_finder) {
  return map_stream.obj(function(record) {
    var wofDoc = new Document( 'whosonfirst', record.place_type, record.id );

    if (record.name) {
      wofDoc.setName('default', record.name);
    }
    wofDoc.setCentroid({ lat: record.lat, lon: record.lon });

    // only set population if available
    if (record.population) {
      wofDoc.setPopulation(record.population);
    }

    // only set popularity if available
    if (record.popularity) {
      wofDoc.setPopularity(record.popularity);
    }

    // WOF bbox is defined as:
    // lowerLeft.lon, lowerLeft.lat, upperRight.lon, upperRight.lat
    // so convert to what ES understands
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

    // iterate the hierarchy, assigning fields
    hierarchy_finder(record).forEach(function(hierarchy_element) {
      switch (hierarchy_element.place_type) {
        case 'locality':
          wofDoc.setAdmin( 'locality', hierarchy_element.name);
          wofDoc.addParent('locality', hierarchy_element.name, hierarchy_element.id.toString());
          break;
        case 'localadmin':
          wofDoc.setAdmin( 'local_admin', hierarchy_element.name);
          wofDoc.addParent('localadmin', hierarchy_element.name, hierarchy_element.id.toString());
          break;
        case 'county':
          wofDoc.setAdmin( 'admin2', hierarchy_element.name);
          wofDoc.addParent('county', hierarchy_element.name, hierarchy_element.id.toString());
          break;
        case 'macrocounty':
          wofDoc.addParent('macrocounty', hierarchy_element.name, hierarchy_element.id.toString());
          break;
        case 'region':
          wofDoc.setAdmin( 'admin1', hierarchy_element.name);
          if (hierarchy_element.abbreviation) {
            wofDoc.setAdmin( 'admin1_abbr', hierarchy_element.abbreviation );
            wofDoc.addParent('region', hierarchy_element.name, hierarchy_element.id.toString(), hierarchy_element.abbreviation);
          } else {
            wofDoc.addParent('region', hierarchy_element.name, hierarchy_element.id.toString());
          }
          break;
        case 'macroregion':
          wofDoc.addParent('macroregion', hierarchy_element.name, hierarchy_element.id.toString());
          break;
        case 'country':
          wofDoc.setAdmin( 'admin0', hierarchy_element.name);

          // this is placetype=country, so lookup and set the iso3 from iso2
          if (iso3166.is2(hierarchy_element.iso2)) {
            var iso3 = iso3166.to3(hierarchy_element.iso2);

            wofDoc.setAlpha3(iso3);
            wofDoc.addParent('country', hierarchy_element.name, hierarchy_element.id.toString(), iso3);

          } else {
            wofDoc.addParent('country', hierarchy_element.name, hierarchy_element.id.toString());

          }

          break;
      }
    });

    return wofDoc;

  });

};
