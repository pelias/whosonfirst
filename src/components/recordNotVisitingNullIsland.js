const filter = require('through2-filter');
const _ = require('lodash');

/*
  This function filters out null island records

  Filter out any postalcodes located at 0,0 because there are currently too many of those
*/

function isNullIslandPostalCode(record) {
  return record.placetype === 'postalcode' &&
          record.geom_latitude === '0.0' &&
          record.geom_longitude === '0.0';
}

module.exports.create = function create() {
  return filter.obj(_.negate(isNullIslandPostalCode));
};
