var through2 = require('through2');
var _ = require('lodash');

// this function is used to verify that a US county QS altname is available
function isUsCounty(base_record, qs_a2_alt) {
  return 'US' === base_record.iso2 &&
          'county' === base_record.place_type &&
          !_.isUndefined(qs_a2_alt);
}

// this function favors gn:population when available, falling back to zs:pop10
//  when available and > 0
function getPopulation(properties) {
  if (properties['gn:population']) {
    return properties['gn:population'];
  } else if (properties['zs:pop10']) {
    return properties['zs:pop10'];
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

/*
  This function extracts the fields from the json_object that we're interested
  in for creating Pelias Document objects.  If there is no hierarchy then a
  hierarchy-less object is added.  If there are multiple hierarchies for the
  record then a record for each hierarchy is pushed onto the stream.
*/
module.exports.create = function map_fields_stream() {
  return through2.obj(function(json_object, enc, callback) {
    var base_record = {
      id: json_object.id,
      name: json_object.properties['wof:name'],
      abbreviation: json_object.properties['wof:abbreviation'],
      place_type: json_object.properties['wof:placetype'],
      parent_id: json_object.properties['wof:parent_id'],
      lat: getLat(json_object.properties),
      lon: getLon(json_object.properties),
      bounding_box: json_object.properties['geom:bbox'],
      iso2: json_object.properties['iso:country'],
      population: getPopulation(json_object.properties),
      popularity: json_object.properties['misc:photo_sum']
    };

    // use the QS altname if US county and available
    if (isUsCounty(base_record, json_object.properties['qs:a2_alt'])) {
      base_record.name = json_object.properties['qs:a2_alt'];
    }

    // if there's no hierarchy then just add the base record
    if (_.isUndefined(json_object.properties['wof:hierarchy'])) {
      this.push(base_record);

    } else {
      // otherwise, clone the base record for each hierarchy in the list and push
      json_object.properties['wof:hierarchy'].forEach(function(hierarchy) {
        var clone = _.clone(base_record, true);
        clone.hierarchy = hierarchy;
        this.push(clone);
      }, this);

    }

    return callback();

  });

};
