var map = require('through2-map');
var fs = require('fs');

module.exports.create = function create_json_parse_stream(dataDirectory) {
  return map.obj(function(filename) {
    try {
      return JSON.parse(fs.readFileSync(dataDirectory + filename));
    } catch (err) {
      console.error('exception on %s:', filename, err);
      return {};
    }
  });
};
