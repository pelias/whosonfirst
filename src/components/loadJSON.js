var fs = require('fs');
var parallelStream = require('pelias-parallel-stream');

var maxInFlight = 10;

module.exports.create = function create_json_parse_stream(dataDirectory) {
  return parallelStream(maxInFlight, function(record, enc, next) {
    fs.readFile(dataDirectory + record.path, function(err, data) {
      if (err) {
        next(err);
      } else {
        try {
          var object = JSON.parse(data);
          next(null, object);
        } catch (parse_err) {
          console.error('exception on %s:', record.path, parse_err);
          console.error('Inability to parse JSON usually means that WOF has been cloned ' +
                        'without using git-lfs, please see instructions here: ' +
                        'https://github.com/whosonfirst/whosonfirst-data#git-and-large-files');
          next(null, {});
        }
      }
    });
  });
};
