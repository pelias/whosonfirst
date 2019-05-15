const through2 = require('through2');
const _ = require('lodash');
const iso3166 = require('iso3166-1');
const log = require('pelias-logger').get('openstreetmap');

const Document = require('pelias-model').Document;

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
      // the above place_types don't have abbrevations (yet)
      wofDoc.addParent(hierarchyElement.place_type, hierarchyElement.name, hierarchyElement.id.toString());
      break;
    case 'postalcode':
      var sans_whitespace = (hierarchyElement.name||'').replace(/\s/g, '');
      if (sans_whitespace !== hierarchyElement.name) {
        wofDoc.addParent(hierarchyElement.place_type, hierarchyElement.name, hierarchyElement.id.toString(), sans_whitespace);
      } else {
        wofDoc.addParent(hierarchyElement.place_type, hierarchyElement.name, hierarchyElement.id.toString());
      }
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
      // this is country or dependency, so lookup and set the iso3 from abbreviation
      if (iso3166.is2(hierarchyElement.abbreviation)) {
        var iso3 = iso3166.to3(hierarchyElement.abbreviation);

        wofDoc.addParent(hierarchyElement.place_type, hierarchyElement.name, hierarchyElement.id.toString(), iso3);

      } else {
        // there's no known abbreviation
        wofDoc.addParent(hierarchyElement.place_type, hierarchyElement.name, hierarchyElement.id.toString());

      }

      break;
  }

}

function addMultiLangAliases(wofDoc, name_langs) {
  for (let lang in name_langs) {
    for (let i = 0; i < name_langs[lang].length; i++) {
      if (i === 0) {
        wofDoc.setName(lang, name_langs[lang][i]);
      } else {
        wofDoc.setNameAlias(lang, name_langs[lang][i]);
      }
    }
  }
}

// method that extracts the logic for Document creation.  `hierarchy` is optional
function setupDocument(record, hierarchy) {
  var wofDoc = new Document( 'whosonfirst', record.place_type, record.id );

  if (record.name) {
    wofDoc.setName('default', record.name);

    // index a version of postcode which doesn't contain whitespace
    if (record.place_type === 'postalcode' && typeof record.name === 'string') {
      var sans_whitespace = record.name.replace(/\s/g, '');
      if (sans_whitespace !== record.name) {
        wofDoc.setNameAlias('default', sans_whitespace);
      }
    }

    // index name aliases for all other records (where available)
    else {
      if (record.name_aliases.length) {
        record.name_aliases.forEach(alias => {
          wofDoc.setNameAlias('default', alias);
        });
      }
      if (record.name_langs) {
        addMultiLangAliases(wofDoc, record.name_langs);
      }
    }
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

    try {
      if (hierarchies && hierarchies.length > 0) {
        hierarchies.forEach(function(hierarchy) {
          this.push(setupDocument(record, hierarchy));
        }, this);

      } else {
        this.push(setupDocument(record));
      }
    }
    catch (e) {
      log.error(`doc generator error: ${e.message}`);
      log.error(JSON.stringify(record, null, 2));
    }

    next();

  });

};
