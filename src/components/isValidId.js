var filter = require('through2-filter');

module.exports.create = function isValidId() {
  return filter.obj(function(record) {
    return record.hasOwnProperty('id') &&
            record.id &&
            record.id.toString().length > 6;
  });
};
