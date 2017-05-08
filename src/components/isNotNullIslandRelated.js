const filter = require('through2-filter');
const _ = require('lodash');

function isNullIsland(record) {
  return _.toNumber(record.id) === 1;
}

function isPostalCodeOnNullIsland(record) {
  return record.placetype === 'postalcode' &&
          record.geom_latitude === '0.0' &&
          record.geom_longitude === '0.0';
}

module.exports.create = function create() {
  return filter.obj((record) => {
    return !isNullIsland(record) && !isPostalCodeOnNullIsland(record);
  });
};
