var through2 = require('through2');
var _ = require('lodash');

// this function is used to verify that a US county QS altname is available
function isUsCounty(base_record, wof_country, qs_a2_alt) {
  return 'US' === wof_country &&
          'county' === base_record.place_type &&
          !_.isUndefined(qs_a2_alt);
}

// this function favors mz:population when available, falling back to other properties.
// see: https://github.com/whosonfirst-data/whosonfirst-data/issues/240#issuecomment-294907374
function getPopulation( props ) {
       if( props['mz:population'] ){          return props['mz:population']; }
  else if( props['wof:population'] ){         return props['wof:population']; }
  else if( props['wk:population'] ){          return props['wk:population']; }
  else if( props['gn:population'] ){          return props['gn:population']; }
  else if( props['gn:pop'] ){                 return props['gn:pop']; }
  else if( props['qs:pop'] ){                 return props['qs:pop']; }
  else if( props['qs:gn_pop'] ){              return props['qs:gn_pop']; }
  else if( props['zs:pop10'] ){               return props['zs:pop10']; }
  else if( props['meso:pop'] ){               return props['meso:pop']; }
  else if( props['statoids:population'] ){    return props['statoids:population']; }
  else if( props['ne:pop_est'] ){             return props['ne:pop_est']; }
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

function isDependencyOrCountry(placetype) {
  return placetype === 'dependency' || placetype === 'country';
}

function getAbbreviation(properties) {
  if (isDependencyOrCountry(properties['wof:placetype']) && properties['wof:country']) {
    return properties['wof:country'];
  }
  return properties['wof:abbreviation'];
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
      abbreviation: getAbbreviation(json_object.properties),
      place_type: json_object.properties['wof:placetype'],
      lat: getLat(json_object.properties),
      lon: getLon(json_object.properties),
      bounding_box: getBoundingBox(json_object.properties),
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
