var map = require('through2-map');
var sep = require('path').sep;

module.exports.create = function() {
  return map.obj(function(record) {
    var id = record.id.toString();

    return [
      id.substr(0, 3),
      id.substr(3, 3),
      id.substr(6),
      id + '.geojson'
    ].join(sep);

  });
};
