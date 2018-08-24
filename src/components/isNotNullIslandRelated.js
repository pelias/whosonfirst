const filter = require('through2-filter');
const _ = require('lodash');

function isNullIsland(record) {
  return _.toNumber(record.id) === 1;
}

function isOnNullIsland(record) {
  return (record.geom_latitude === '0.0' || record.geom_latitude === 0) &&
         (record.geom_longitude === '0.0' || record.geom_longitude === 0);
}

function isPostalCodeOnNullIsland(record) {
  return record.placetype === 'postalcode' &&
         isOnNullIsland(record);
}

module.exports.create = function create() {
  return filter.obj((record) => {
    return !isNullIsland(record) && !isPostalCodeOnNullIsland(record);
  });
};
