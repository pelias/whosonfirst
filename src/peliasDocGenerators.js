var through2 = require('through2');
var _ = require('lodash');

var Document = require('pelias-model').Document;

module.exports = {};

function assignField(hierarchyElement, wofDoc) {
  switch (hierarchyElement.place_type) {
    case 'neighbourhood':
    case 'locality':
    case 'borough':
    case 'localadmin':
    case 'county':
    case 'macrocounty':
    case 'macroregion':
    case 'empire':
    case 'continent':
    case 'ocean':
    case 'marinearea':
    case 'postalcode':
      // the above place_types don't have abbrevations (yet)
      wofDoc.addParent(hierarchyElement.place_type, hierarchyElement.name, hierarchyElement.id.toString());
      break;
    case 'region':
      if (hierarchyElement.hasOwnProperty('abbreviation')) {
        wofDoc.addParent(hierarchyElement.place_type, hierarchyElement.name, hierarchyElement.id.toString(), hierarchyElement.abbreviation);
      } else {
        wofDoc.addParent(hierarchyElement.place_type, hierarchyElement.name, hierarchyElement.id.toString());
      }
      break;
    case 'dependency':
    case 'country':
      // this is country or dependency, so set the ISO-3166-1 alpha3 code from abbreviation
      if (hierarchyElement.abbreviation) {
        wofDoc.addParent(hierarchyElement.place_type, hierarchyElement.name, hierarchyElement.id.toString(), hierarchyElement.abbreviation);
      } else {
        // there's no known abbreviation
        wofDoc.addParent(hierarchyElement.place_type, hierarchyElement.name, hierarchyElement.id.toString());
      }

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

  // add self to parent hierarchy for postalcodes only
  if (record.place_type === 'postalcode') {
    assignField(record, wofDoc);
  }

  return wofDoc;

}

module.exports.create = function(hierarchy_finder) {
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
