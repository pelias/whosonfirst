var filter = require('through2-filter');
var _ = require('lodash');

// this component isn't used by the whosonfirst importer directly but is useful
//  for easier filtering in ad hoc scripts
module.exports.create = function(model) {
  return filter.obj((wofData) => {
    return _.conformsTo(wofData, model);
  });
};
