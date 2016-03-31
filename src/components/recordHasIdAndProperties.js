var filter = require('through2-filter');

/*
  This function filters out incomplete records
*/
module.exports.create = function() {
  return filter.obj(function(json_object) {
    return json_object.id && json_object.hasOwnProperty('properties');
  });
};
