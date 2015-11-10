var fs = require( 'fs' );

var map_stream = require('through2-map');
var filter_stream = require('through2-filter');
var through2 = require('through2');

var supported_placetypes = ['neighbourhood', 'locality', 'county', 'region', 'country'];

var filter_directory_stream = function create_filter_directory_stream() {
  return filter_stream.obj(function(stats_object) {
    return stats_object.stats.isFile();
  });
};

var json_parse_stream = function create_json_parse_stream() {
  return map_stream.obj(function(stats_object) {
    return JSON.parse(fs.readFileSync(stats_object.path));
  });
};

var filter_bad_files_stream = function create_filter_bad_files_stream() {
  return filter_stream.obj(function(json_object) {
    return json_object.id && json_object.hasOwnProperty('properties');
  });
};

var filter_unsupported_placetypes_stream = function create_filter_unsupported_placetypes() {
  return filter_stream.obj(function(wofRecord) {
    return supported_placetypes.indexOf(wofRecord.properties['wof:placetype']) !== -1;
  });
};

var object_map_function = function(wofRecord) {
  return {
    id: wofRecord.id,
    name: wofRecord.properties['wof:name'],
    hierarchy: wofRecord.properties['wof:hierarchy'][0],
    lat: wofRecord.properties['geom:latitude'],
    lon: wofRecord.properties['geom:longitude'],
    placetype: wofRecord.properties['wof:placetype']
  };
};

// have to use a full through2 stream to get on 'finish'
var map_fields_stream = function create_map_fields_stream(wofRecords) {
  return through2.obj(function(chunk, enc, callback) {
    wofRecords[chunk.id] = object_map_function(chunk);
    return callback();
  });
};

module.exports = {
  filter_directory_stream: filter_directory_stream,
  json_parse_stream: json_parse_stream,
  filter_bad_files_stream: filter_bad_files_stream,
  filter_unsupported_placetypes_stream: filter_unsupported_placetypes_stream,
  map_fields_stream: map_fields_stream
};
