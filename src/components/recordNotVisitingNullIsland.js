var filter = require('through2-filter');
var _ = require('lodash');

/*
  This function filters out null island records

  Filter out any postalcodes located at 0,0 because there are currently too many of those
*/
module.exports.create = function create() {
  return filter.obj(function(json_object) {
    return _.get(json_object, 'place_type', '') !== 'postalcode' ||
      (_.get(json_object, 'place_type', '') === 'postalcode' &&
       _.get(json_object, 'lat', 0) !== 0 &&
       _.get(json_object, 'lon', 0) !== 0);
  });
};
