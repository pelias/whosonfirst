var filter = require('through2-filter');
var _ = require('lodash');

module.exports.create = function create() {
  return filter.obj(function(wofRecord) {
    return !_.isEmpty(_.trim(wofRecord.name));
  });
};
