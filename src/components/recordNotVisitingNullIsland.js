var filter = require('through2-filter');
var _ = require('lodash');

/*
  This function filters out null island records

  Filter out any postalcodes located at 0,0 because there are currently too many of those
*/
module.exports.create = function create() {
  return filter.obj((record) => {
    if (record.placetype === 'postalcode' && record.geom_latitude === '0.0' && record.geom_longitude === '0.0') {
      return false;
    }
    return true;
  });
};
