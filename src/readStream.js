var fs_extra = require('fs-extra');

var readStreamComponents = require('./readStreamComponents');

function readData(directory, wofRecords, callback) {
  var filename_stream = fs_extra.walk(directory);

  var filter_directory_stream = readStreamComponents.filter_directory_stream();
  var json_parse_stream = readStreamComponents.json_parse_stream();
  var filter_bad_files_stream = readStreamComponents.filter_bad_files_stream();
  var filter_unsupported_placetypes_stream = readStreamComponents.filter_unsupported_placetypes_stream();
  var map_fields_stream = readStreamComponents.map_fields_stream(wofRecords);

  filename_stream.pipe(filter_directory_stream)
  .pipe(json_parse_stream)
  .pipe(filter_bad_files_stream)
  .pipe(filter_unsupported_placetypes_stream)
  .pipe(map_fields_stream)
  .on('finish', callback);
};

module.exports = readData;
