var map_stream = require('through2-map');
var _ = require('lodash');
var iso3166 = require('iso3166-1');

var Document = require('pelias-model').Document;

var usStates = {
  'Alabama': 'AL',
  'Alaska': 'AK',
  'Arizona': 'AZ',
  'Arkansas': 'AR',
  'California': 'CA',
  'Colorado': 'CO',
  'Connecticut': 'CT',
  'Delaware': 'DE',
  'Florida': 'FL',
  'Georgia': 'GA',
  'Hawaii': 'HI',
  'Idaho': 'ID',
  'Illinois': 'IL',
  'Indiana': 'IN',
  'Iowa': 'IA',
  'Kansas': 'KS',
  'Kentucky': 'KY',
  'Louisiana': 'LA',
  'Maine': 'ME',
  'Maryland': 'MD',
  'Massachusetts': 'MA',
  'Michigan': 'MI',
  'Minnesota': 'MN',
  'Mississippi': 'MS',
  'Missouri': 'MO',
  'Montana': 'MT',
  'Nebraska': 'NE',
  'Nevada': 'NV',
  'New Hampshire': 'NH',
  'New Jersey': 'NJ',
  'New Mexico': 'NM',
  'New York': 'NY',
  'North Carolina': 'NC',
  'North Dakota': 'ND',
  'Ohio': 'OH',
  'Oklahoma': 'OK',
  'Oregon': 'OR',
  'Pennsylvania': 'PA',
  'Rhode Island': 'RI',
  'South Carolina': 'SC',
  'South Dakota': 'SD',
  'Tennessee': 'TN',
  'Texas': 'TX',
  'Utah': 'UT',
  'Vermont': 'VT',
  'Virginia': 'VA',
  'Washington': 'WA',
  'Washington, D.C.': 'DC',
  'West Virginia': 'WV',
  'Wisconsin': 'WI',
  'Wyoming': 'WY'
};

usStates.isSupported = function(name) {
  return this.hasOwnProperty(name);
};

usStates.getAbbreviation = function(name) {
  return this[name];
};

function isUS(record) {
  return 'US' === record.iso2;
}

module.exports = {};

module.exports.createPeliasDocGenerator = function(hierarchy_finder) {
  return map_stream.obj(function(record) {
    var wofDoc = new Document( 'whosonfirst', record.id );
    if (record.name) {
      wofDoc.setName('default', record.name);
    }
    wofDoc.setCentroid({ lat: record.lat, lon: record.lon });

    if (iso3166.is2(record.iso2)) {
      wofDoc.setAlpha3(iso3166.to3(record.iso2));
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
          break;
        case 'county':
          wofDoc.setAdmin( 'admin2', hierarchy_element.name);
          break;
        case 'region':
          wofDoc.setAdmin( 'admin1', hierarchy_element.name);
          if (isUS(record) && usStates.isSupported(hierarchy_element.name)) {
            wofDoc.setAdmin( 'admin1_abbr', usStates.getAbbreviation(hierarchy_element.name));
          }
          break;
        case 'country':
          wofDoc.setAdmin( 'admin0', hierarchy_element.name);
          break;
      }
    });

    return wofDoc;

  });

};
