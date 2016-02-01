var fs = require( 'fs' );
var through2 = require('through2');
var map_stream = require('through2-map');
var filter_stream = require('through2-filter');
var _ = require('lodash');
var util = require('util');

/*
  this regex is used to test/match strings from WOF meta files that can take
  any of the forms:
  - 856/338/13/85633813.geojson
  - data/856/338/13/85633813.geojson
  - /usr/local/mapzen/whosonfirst/data/856/338/13/85633813.geojson

*/
var validDataFilePath = /([0-9]+\/[0-9]+\/[0-9]+\/[0-9]+\.geojson)$/;

/*
  returns true if record.path is a valid dataFilePath
*/
var is_valid_data_file_path = function is_valid_data_file_path() {
  return filter_stream.obj(function(record) {
    return validDataFilePath.test(record.path);
  });
};

/*
  this function extracts the last portion of the path for a record, eg:
  'data/856/338/13/85633813.geojson' returns '856/338/13/85633813.geojson'
*/
var normalize_file_path = function normalize_file_path() {
  return map_stream.obj(function(record) {
    return record.path.match(validDataFilePath)[1];
  });
};

/*
  this function verifies that a file exists and is readable, logs an error otherwise
*/
var file_is_readable = function file_is_readable(dataDirectory) {
  return filter_stream.obj(function(filename) {
    try {
      fs.accessSync(dataDirectory + '/' + filename, fs.R_OK);
      return true;
    }
    catch (err) {
      console.error(util.format('data file cannot be read: %s', dataDirectory + '/' + filename));
      return false;
    }
  });
};

/*
  This function converts a file to an object (JSON-parsed)
*/
var json_parse_stream = function create_json_parse_stream(dataDirectory) {
  return map_stream.obj(function(filename) {
    try {
      return JSON.parse(fs.readFileSync(dataDirectory + filename));
    } catch (err) {
      console.error('exception on %s:', filename, err);
      return {};
    }
  });
};

/*
  This function filters out incomplete records
*/
var filter_incomplete_files_stream = function create_filter_bad_files_stream() {
  return filter_stream.obj(function(json_object) {
    return json_object.id && json_object.hasOwnProperty('properties');
  });
};

/*
  This function extracts the fields from the json_object that we're interested
  in for creating Pelias Document objects.  If there is no hierarchy then a
  hierarchy-less object is added.  If there are multiple hierarchies for the
  record then a record for each hierarchy is pushed onto the stream.
*/
var map_fields_stream = function map_fields_stream() {
  return through2.obj(function(json_object, enc, callback) {
    var base_record = {
      id: json_object.id,
      name: json_object.properties['wof:name'],
      abbreviation: json_object.properties['wof:abbreviation'],
      place_type: json_object.properties['wof:placetype'],
      parent_id: json_object.properties['wof:parent_id'],
      lat: json_object.properties['geom:latitude'],
      lon: json_object.properties['geom:longitude'],
      bounding_box: json_object.properties['geom:bbox'],
      iso2: json_object.properties['iso:country'],
      population: json_object.properties['gn:population'],
      popularity: json_object.properties['misc:photo_sum']
    };

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

module.exports = {
  is_valid_data_file_path: is_valid_data_file_path,
  normalize_file_path: normalize_file_path,
  file_is_readable: file_is_readable,
  json_parse_stream: json_parse_stream,
  filter_incomplete_files_stream: filter_incomplete_files_stream,
  map_fields_stream: map_fields_stream
};
