var filter = require('through2-filter');
var fs = require('fs');
var path = require('path');
var util = require('util');

module.exports.create = function create(dataDirectory) {
  return filter.obj(function(record) {
    var fullpath = path.join(dataDirectory, record.path);

    try {
      fs.accessSync(fullpath, fs.R_OK);
      return true;
    }
    catch (err) {
      console.error(util.format('data file cannot be read: %s', fullpath));
      return false;
    }
  });
};
