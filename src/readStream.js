var parse = require('csv-parse');
var fs = require('fs');
var batch = require('batchflow');
var sink = require('through2-sink');

var readStreamComponents = require('./readStreamComponents');

/*
  This function finds all the `latest` files in `meta/`, CSV parses them,
  extracts the required fields, and assigns to a big collection
*/
function readData(directory, types, wofRecords, callback) {
  batch(types).parallel(2).each(function(idx, type, done) {
    var csv_parser = parse({ delimiter: ',', columns: true });
    var is_valid_data_file_path = readStreamComponents.is_valid_data_file_path();
    var normalize_file_path = readStreamComponents.normalize_file_path();
    var file_is_readable = readStreamComponents.file_is_readable(directory + 'data/');
    var json_parse_stream = readStreamComponents.json_parse_stream(directory + 'data/');
    var filter_incomplete_files_stream = readStreamComponents.filter_incomplete_files_stream();
    var map_fields_stream = readStreamComponents.map_fields_stream();

    fs.createReadStream(directory + 'meta/wof-' + type + '-latest.csv')
    .pipe(csv_parser)
    .pipe(is_valid_data_file_path)
    .pipe(normalize_file_path)
    .pipe(file_is_readable)
    .pipe(json_parse_stream)
    .pipe(filter_incomplete_files_stream)
    .pipe(map_fields_stream)
    .pipe(sink.obj(function(wofRecord) {
      wofRecords[wofRecord.id] = wofRecord;
    }))
    .on('finish', done);

  }).error(function(err) {
    console.error(err);
  }).end(function() {
    callback();
  });

}

module.exports = readData;
