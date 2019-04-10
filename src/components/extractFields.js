var through2 = require('through2');
var _ = require('lodash');

// hierarchy in importance-descending order of population fields
const population_hierarchy = [
  'mz:population',
  'wof:population',
  'wk:population',
  'gn:population',
  'gn:pop',
  'qs:pop',
  'qs:gn_pop',
  'zs:pop10',
  'meso:pop',
  'statoids:population',
  'ne:pop_est'
];

// WOF fields to use for aliases
const name_alias_fields = [
  'name:eng_x_preferred',
  'name:eng_x_variant'
];

// this function is used to verify that a US county QS altname is available
function isUsCounty(base_record, wof_country, qs_a2_alt) {
  return 'US' === wof_country &&
          'county' === base_record.place_type &&
          !_.isUndefined(qs_a2_alt);
}

// this function favors mz:population when available, falling back to other properties.
// see: https://github.com/whosonfirst-data/whosonfirst-data/issues/240#issuecomment-294907374
function getPopulation( props ) {
  // extract all the population values as numbers and find the first non-negative value
  // returns undefined if there are no such values
  return population_hierarchy.
          map((field) => { return _.toNumber(props[field]); }).
          find((val) => { return val >= 0; } );
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

// get an array of language codes spoken at this location
function getLanguages(properties) {
  if (!Array.isArray(properties['wof:lang_x_official'])) {
    return [];
  }
  return properties['wof:lang_x_official']
    .filter(l => (typeof l === 'string' && l.length === 3))
    .map(l => l.toLowerCase());
}

// convenience function to safely concat array fields
function concatArrayFields(properties, fields){
  let arr = [];
  fields.forEach(field => {
    if (Array.isArray(properties[field]) && properties[field].length) {
      arr = arr.concat(properties[field]);
    }
  });
  // dedupe array
  return arr.filter((item, pos, self) => self.indexOf(item) === pos);
}

// note: 'wof:label' has been officially deprecated
// see: https://github.com/whosonfirst-data/whosonfirst-data/issues/1540
// see: https://github.com/whosonfirst-data/whosonfirst-data/pull/1548
function getName(properties) {

  // look for a label in one of the official languages
  let langs = getLanguages(properties);
  if (!langs.includes('eng')) { langs.push('eng'); } // otherwise fallback to english

  // find all relevant labels
  let labelFields = langs.map(l => `label:${l}_x_preferred_longname`);
  let labels = concatArrayFields(properties, labelFields);
  if( labels.length ){ return labels[0]; }

  // fall back to the deprecated 'wof:label' property
  if (properties.hasOwnProperty('wof:label')) {
    return properties['wof:label'];
  }
  // use the 'wof:name' property
  return properties['wof:name'];
}

function getAbbreviation(properties) {
  if (properties['wof:placetype'] === 'country' && properties['wof:country']) {
    return properties['wof:country'];
  }

  // TODO: remove this section once WOF no-longer puts dependency abbreviations in `wof:country`
  if (properties['wof:placetype'] === 'dependency') {
    return properties['wof:shortcode'] || properties['wof:abbreviation'] || properties['wof:country'];
  }

  return properties['wof:shortcode'] || properties['wof:abbreviation'];
}

function getHierarchies(id, properties) {
  // if there are no hierarchies but there's a placetype, synthesize a hierarchy
  if (_.isEmpty(_.get(properties, 'wof:hierarchy')) && _.has(properties, 'wof:placetype')) {
    const hierarchy = {};
    hierarchy[properties['wof:placetype'] + '_id'] = id;

    return [hierarchy];

  }

  // otherwise just return the hierarchies as-is
  return _.defaultTo(properties['wof:hierarchy'], []);

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
      name_aliases: concatArrayFields(json_object.properties, name_alias_fields),
      abbreviation: getAbbreviation(json_object.properties),
      place_type: json_object.properties['wof:placetype'],
      lat: getLat(json_object.properties),
      lon: getLon(json_object.properties),
      bounding_box: getBoundingBox(json_object.properties),
      population: getPopulation(json_object.properties),
      popularity: json_object.properties['misc:photo_sum'],
      hierarchies: getHierarchies(json_object.id, json_object.properties)
    };

    // use the QS altname if US county and available
    if (isUsCounty(record, json_object.properties['wof:country'], json_object.properties['qs:a2_alt'])) {
      record.name = json_object.properties['qs:a2_alt'];
    }

    return callback(null, record);

  });

};
