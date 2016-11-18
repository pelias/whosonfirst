var map = require('through2-map');
var fs = require('fs');

module.exports.create = function create_json_parse_stream(dataDirectory) {
  return map.obj(function(record) {
    try {
      return JSON.parse(fs.readFileSync(dataDirectory + record.path));
    } catch (err) {
      console.error('exception on %s:', record.path, err);
      console.error('Inability to parse JSON usually means that WOF has been cloned ' +
                    'without using git-lfs, please see instructions here: ' +
                    'https://github.com/whosonfirst/whosonfirst-data#git-and-large-files');
      return {};
    }
  });
};
