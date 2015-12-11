var event_stream = require('event-stream');
var _ = require('lodash');

module.exports = {};

module.exports.createWofRecordsStream = function(wofRecords) {
  var ids = Object.keys(wofRecords);

  return event_stream.readable(function (count, callback) {
    var id = ids.shift();

    if (_.isUndefined(id)) {
      return this.emit('end');
    }

    this.emit('data', wofRecords[id]);
    callback();

  });

};
