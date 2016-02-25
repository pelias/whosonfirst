var through2 = require('through2');
var _ = require('lodash');
var iso3166 = require('iso3166-1');

var Document = require('pelias-model').Document;

module.exports = {};

function assignField(hierarchyElement, wofDoc) {
  switch (hierarchyElement.place_type) {
    case 'locality':
      wofDoc.setAdmin( 'locality', hierarchyElement.name);
      wofDoc.addParent('locality', hierarchyElement.name, hierarchyElement.id.toString());
      break;
    case 'localadmin':
      wofDoc.setAdmin( 'local_admin', hierarchyElement.name);
      wofDoc.addParent('localadmin', hierarchyElement.name, hierarchyElement.id.toString());
      break;
    case 'county':
      wofDoc.setAdmin( 'admin2', hierarchyElement.name);
      wofDoc.addParent('county', hierarchyElement.name, hierarchyElement.id.toString());
      break;
    case 'region':
      wofDoc.setAdmin( 'admin1', hierarchyElement.name);
      // if the region has an abbreviation, set it
      if (hierarchyElement.abbreviation) {
        wofDoc.setAdmin( 'admin1_abbr', hierarchyElement.abbreviation );
        wofDoc.addParent('region', hierarchyElement.name, hierarchyElement.id.toString(), hierarchyElement.abbreviation);
      } else {
        wofDoc.addParent('region', hierarchyElement.name, hierarchyElement.id.toString());
      }
      break;
    case 'country':
      wofDoc.setAdmin( 'admin0', hierarchyElement.name);
      wofDoc.addParent('country', hierarchyElement.name, hierarchyElement.id.toString());
      break;
  }

}

// method that extracts the logic for Document creation.  `hierarchy` is optional
function setupDocument(record, hierarchy) {
  var wofDoc = new Document( 'whosonfirst', record.place_type, record.id );

  if (record.name) {
    wofDoc.setName('default', record.name);
  }
  wofDoc.setCentroid({ lat: record.lat, lon: record.lon });

  // if the iso2 is supported, lookup and set the iso3
  if (iso3166.is2(record.iso2)) {
    wofDoc.setAlpha3(iso3166.to3(record.iso2));
  }

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

  // a `hierarchy` is composed of potentially multiple WOF records, so iterate
  // and assign fields
  if (!_.isUndefined(hierarchy)) {
    hierarchy.forEach(function(hierarchyElement) {
      assignField(hierarchyElement, wofDoc);
    });

  }

  return wofDoc;

}

module.exports.createPeliasDocGenerator = function(hierarchy_finder) {
  return through2.obj(function(record, enc, next) {
    // if there are no hierarchies, then just return the doc as-is
    var hierarchies = hierarchy_finder(record);

    if (hierarchies && hierarchies.length > 0) {
      hierarchies.forEach(function(hierarchy) {
        this.push(setupDocument(record, hierarchy));
      }, this);

    } else {
      this.push(setupDocument(record));

    }

    next();

  });

};
