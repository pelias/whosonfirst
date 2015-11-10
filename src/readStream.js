var fs = require( 'fs' );
var glob = require( 'glob' );
var fs_extra = require('fs-extra');
var map_stream = require('through2-map');
var filter_stream = require('through2-filter');
var through2 = require('through2');

function readData(directory, wofRecords, callback) {
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

  // have to use a full through2 stream to get on 'finish'
  var map_fields_stream = through2.obj(function(chunk, enc, callback) {
    wofRecords[chunk.id] = object_map_function(chunk);
    return callback();
  });

  filename_stream.pipe(filter_directory_stream)
  .pipe(json_parse_stream)
  .pipe(filter_bad_files_stream)
  .pipe(map_fields_stream)
  .on('finish', callback);
};

module.exports = readData;
