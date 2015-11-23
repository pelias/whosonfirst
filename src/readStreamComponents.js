var fs = require( 'fs' );

var map_stream = require('through2-map');
var filter_stream = require('through2-filter');

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
}

/*
  this function extracts the last portion of the path for a record, eg:
  'data/856/338/13/85633813.geojson' returns '856/338/13/85633813.geojson'
*/
var normalize_file_path = function normalize_file_path() {
  return map_stream.obj(function(record) {
    return record.path.match(validDataFilePath)[1];
  });
}

var json_parse_stream = function create_json_parse_stream(dataDirectory) {
  return map_stream.obj(function(filename) {
    return JSON.parse(fs.readFileSync(dataDirectory + filename));
  });
};

var filter_incomplete_files_stream = function create_filter_bad_files_stream() {
  return filter_stream.obj(function(json_object) {
    return json_object.id && json_object.hasOwnProperty('properties');
  });
};

var map_fields_stream = function map_fields_stream() {
  return map_stream.obj(function(json_object) {
    return {
      id: json_object.id,
      name: json_object.properties['wof:name'],
      hierarchy: json_object.properties['wof:hierarchy'][0],
      lat: json_object.properties['geom:latitude'],
      lon: json_object.properties['geom:longitude'],
      placetype: json_object.properties['wof:placetype']
    };
  })

};

module.exports = {
  is_valid_data_file_path: is_valid_data_file_path,
  normalize_file_path: normalize_file_path,
  json_parse_stream: json_parse_stream,
  filter_incomplete_files_stream: filter_incomplete_files_stream,
  map_fields_stream: map_fields_stream
};
