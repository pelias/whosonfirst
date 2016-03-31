var filter = require('through2-filter');
var _ = require('lodash');

module.exports.create = function() {
  return filter.obj(function(wofData) {
    return _.isEmpty(_.trim(wofData.properties['edtf:deprecated']));
  });
};
