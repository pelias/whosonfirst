var filter = require('through2-filter');
var _ = require('lodash');

function isDeprecated(wofData) {
  return !_.isEmpty(_.trim(wofData.properties['edtf:deprecated']));
}

function isSuperseded(wofData) {
  return !_.isEmpty(_.trim(wofData.properties['edtf:superseded']));
}

function isCurrent(wofData) {
  return wofData.properties['mz:is_current'] !== 0;
}

module.exports.create = function() {
  return filter.obj(function(wofData) {
    return !isDeprecated(wofData) && !isSuperseded(wofData) && isCurrent(wofData);
  });
};
