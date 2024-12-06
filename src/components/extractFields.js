const through2 = require('through2');
const _ = require('lodash');
const util = require('util');
const iso639 = require('../helpers/iso639');

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
// note the '%s' is replaced by a language code
const NAME_ALIAS_FIELDS = [
  'name:%s_x_preferred',
  'label:%s_x_preferred_longname',
  'label:%s_x_preferred'
];

const WOF_NAMES_REGEX = /^(name|label):[a-z]{3}_x_preferred$/;

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
// see: https://github.com/whosonfirst-data/whosonfirst-data/issues/1540#issuecomment-481824475
// see: https://github.com/whosonfirst-data/whosonfirst-data/issues/1540
// see: https://github.com/whosonfirst-data/whosonfirst-data/pull/1548
function getName(properties) {

  // consider all official languages + english
  let langs = getLanguages(properties);
  if (!langs.includes('eng')) { langs.push('eng'); }

  // find the most relevant label
  let labelFields = langs.map(l => `label:${l}_x_preferred_longname`);
  labelFields = labelFields.concat(langs.map(l => `label:${l}_x_preferred`));
  let labels = concatArrayFields(properties, labelFields);
  if( labels.length ){ return labels[0]; }

  // fall back to the deprecated 'wof:label' property
  if (properties.hasOwnProperty('wof:label')) {
    return properties['wof:label'];
  }
  // use the 'wof:name' property
  return properties['wof:name'];
}

function getNameAliases(properties) {

  // consider all official languages + english
  let langs = getLanguages(properties);
  if (!langs.includes('eng')) { langs.push('eng'); }

  // compile a list of relevant name fields
  let nameFields = [];
  langs.forEach(l => {
    nameFields = nameFields.concat(
      NAME_ALIAS_FIELDS.map(f => util.format(f, l) )
    );
  });

  // return an array of name aliases
  return concatArrayFields(properties, nameFields);
}

function getMultiLangNames(defaultName, properties) {
  return Object.keys(properties)
    .filter(key => WOF_NAMES_REGEX.test(key)) // get only matching keys
    .map(key => {
      return {
        key: key.substring(key.indexOf(':') + 1, key.indexOf(':') + 4), // get the iso part of the key name:iso_x_preferred
        value: properties[key]
                .filter(name => !defaultName || defaultName.indexOf(name) < 0) // remove duplicate elements found in default name
      };
    }) //
    .filter(({ key, value }) => value.length > 0 && iso639[key]) // filter correct iso 3 keys
    .map(({key, value}) => { return { key: iso639[key], value: value }; })
    .reduce((langs, { key, value }) =>
      _.set(langs, key, _.union(langs[key], value)), {}
    ); // create the lang/value map
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

// https://github.com/whosonfirst/whosonfirst-properties/blob/main/properties/wof/concordances.json
function getConcordances(properties) {
  let concordances = {};

  // validate types, map 'wof:concordances'
  let con = _.get(properties, 'wof:concordances');
  if (_.isPlainObject(con)) {
    _.each(con, (v, k) => {
      if (!_.isString(k) || !(_.isString(v) || _.isInteger(v))) { return; }
      if (_.isString(v)) { v = v.trim(); }
      if (_.isInteger(v) && v < 1){ return; }
      concordances[k.trim()] = v;
    });
  }

  // map other concordances which may exist with the 'qs_pg' prefix
  // but only when not present in 'wof:concordances'.
  // note: take care with underscore vs. colon delimiters
  _.each({
    'qs_pg:gn_id': 'gn:id',
    'qs_pg:qs_id': 'qs:id'
  }, (k, prop) => {
    if (!_.has(concordances, k)) {
      let v = _.get(properties, prop);
      if (!_.isString(v) && !_.isInteger(v)) { return; }
      if (_.isString(v)) { v = v.trim(); }
      if (_.isInteger(v) && v < 1) { return; }
      concordances[k] = v;
    }
  });

  return concordances;
}

//Update the popularity value field due to https://github.com/whosonfirst-data/whosonfirst-data/pull/979
function getPopularity(properties) {
  if (!_.isEmpty(properties, 'qs:photo_sum')) {
    return properties['qs:photo_sum'];
  }
  //Legacy support
  if (!_.isEmpty(properties, 'misc:photo_sum')) {
    return properties['misc:photo_sum'];
  }
  return undefined;
}

/*
  This function extracts the fields from the json_object that we're interested
  in for creating Pelias Document objects.  If there is no hierarchy then a
  hierarchy-less object is added.  If there are multiple hierarchies for the
  record then a record for each hierarchy is pushed onto the stream.
*/
module.exports.create = function map_fields_stream() {
  return through2.obj(function(json_object, enc, callback) {
    const default_names = getName(json_object.properties);
    var record = {
      id: json_object.id,
      name: default_names,
      name_aliases: getNameAliases(json_object.properties),
      name_langs: getMultiLangNames(default_names, json_object.properties),
      abbreviation: getAbbreviation(json_object.properties),
      place_type: json_object.properties['wof:placetype'],
      lat: getLat(json_object.properties),
      lon: getLon(json_object.properties),
      bounding_box: getBoundingBox(json_object.properties),
      population: getPopulation(json_object.properties),
      popularity: getPopularity(json_object.properties),
      hierarchies: getHierarchies(json_object.id, json_object.properties),
      concordances: getConcordances(json_object.properties)
    };

    // use the QS altname if US county and available
    if (isUsCounty(record, json_object.properties['wof:country'], json_object.properties['qs:a2_alt'])) {
      record.name = json_object.properties['qs:a2_alt'];
    }

    return callback(null, record);

  });

};
