var fs = require( 'fs' );
var glob = require( 'glob' );
var fs_extra = require('fs-extra');
var map_stream = require('through2-map');
var filter_stream = require('through2-filter');

var directory = '../../whosonfirst-data/data/';

var wofRecords = {};

var filename_stream = fs_extra.walk(directory);

var filter_directory_stream = filter_stream.obj(function(stats_object) {
  return stats_object.stats.isFile();
});

var json_parse_stream = map_stream.obj(function(stats_object) {
  return JSON.parse(fs.readFileSync(stats_object.path));
});

var filter_bad_files_stream = filter_stream.obj(function(json_object) {
  return json_object.id && json_object.hasOwnProperty('properties');
});

var object_map_function = function(wofRecord) {
  return {
    id: wofRecord.id,
    name: wofRecord.properties['wof:name'],
    // 'h': wofRecord.properties['wof:hierarchy'],
    lat: wofRecord.properties['geom:latitude'],
    lon: wofRecord.properties['geom:longitude'],
    pt: wofRecord.properties['wof:placetype']
  };
}

var map_fields_stream = map_stream.obj(object_map_function);

var save_object_stream = map_stream.obj(function(obj) {
  wofRecords[obj.id] = obj;
  return obj;
});

filename_stream.pipe(filter_directory_stream)
.pipe(json_parse_stream)
.pipe(filter_bad_files_stream)
.pipe(map_fields_stream)
.pipe(save_object_stream)
.on('finish', function() {
  console.log(Object.keys(wofRecords).length + ' records loaded');

  var importStream = require('./src/importStream');

  importStream(wofRecords);
});
