const filter = require('through2-filter');
const concurrent = require('through2-concurrent');
const through = require('through2');
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
  return concurrent.obj(function(record, enc, next) {
    const that = this;

    if ( !isNullIsland(record) && !isPostalCodeOnNullIsland(record)) {
      that.push(record);
    }
    next();
  });
};
