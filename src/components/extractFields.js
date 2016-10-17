var through2 = require('through2');
var _ = require('lodash');

// this function is used to verify that a US county QS altname is available
function isUsCounty(base_record, wof_country, qs_a2_alt) {
  return 'US' === wof_country &&
          'county' === base_record.place_type &&
          !_.isUndefined(qs_a2_alt);
}

// this function favors gn:population when available, falling back to zs:pop10
//  when available and > 0
function getPopulation(properties) {
  if(properties['mz:population']){
    return properties['mz:population'];
  } else if (properties['gn:population']) {
    return properties['gn:population'];
  } else if (properties['zs:pop10']) {
    return properties['zs:pop10'];
  } else if(properties['qs:pop']){
    return properties['qs:pop'];
  }
}

function getLat(properties) {
  if (properties['lbl:latitude']) {
    return properties['lbl:latitude'];
  } else {
    return properties['geom:latitude'];
  }
}

function getLon(properties) {
  if (properties['lbl:longitude']) {
    return properties['lbl:longitude'];
  } else {
    return properties['geom:longitude'];
  }
}

function getBoundingBox(properties) {
  if (properties.hasOwnProperty('lbl:bbox')) {
    return properties['lbl:bbox'];
  } else {
    return properties['geom:bbox'];
  }
}

function getName(properties) {
  if (properties.hasOwnProperty('wof:label')) {
    return properties['wof:label'];
  } else {
    return properties['wof:name'];
  }
}

/*
  This function extracts the fields from the json_object that we're interested
  in for creating Pelias Document objects.  If there is no hierarchy then a
  hierarchy-less object is added.  If there are multiple hierarchies for the
  record then a record for each hierarchy is pushed onto the stream.
*/
module.exports.create = function map_fields_stream() {
  return through2.obj(function(json_object, enc, callback) {
    var record = {
      id: json_object.id,
      name: getName(json_object.properties),
      abbreviation: json_object.properties['wof:abbreviation'],
      place_type: json_object.properties['wof:placetype'],
      lat: getLat(json_object.properties),
      lon: getLon(json_object.properties),
      bounding_box: getBoundingBox(json_object.properties),
      iso2: json_object.properties['iso:country'],
      population: getPopulation(json_object.properties),
      popularity: json_object.properties['misc:photo_sum'],
      hierarchies: _.get(json_object, 'properties.wof:hierarchy', [])
    };

    // use the QS altname if US county and available
    if (isUsCounty(record, json_object.properties['wof:country'], json_object.properties['qs:a2_alt'])) {
      record.name = json_object.properties['qs:a2_alt'];
    }

    return callback(null, record);

  });

};
