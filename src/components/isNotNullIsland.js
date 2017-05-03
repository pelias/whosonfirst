const filter = require('through2-filter');
const _ = require('lodash');

module.exports.create = function create() {
  return filter.obj((record) => {
    return _.toNumber(_.get(record, 'id')) !== 1;
  });
};
