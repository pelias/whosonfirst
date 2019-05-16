const filter = require('through2-filter');
const _ = require('lodash');

// return number or undefined
function getNumber(value) {
  const numericValue = parseFloat(value);

  if (isNaN(numericValue) || !isFinite(numericValue)) {
    return undefined;
  } else {
    return numericValue;
  }
}

function isNullIsland(record) {
  return _.toNumber(record.id) === 1;
}

function isOnNullIsland(record) {
  return getNumber(record.geom_latitude) === 0 && getNumber(record.geom_longitude) === 0;
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
