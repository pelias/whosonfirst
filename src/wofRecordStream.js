var event_stream = require('event-stream');

module.exports = {};

module.exports.createWofRecordsStream = function(wofRecords) {
  var ids = Object.keys(wofRecords);

  return event_stream.readable(function (count, callback) {
    if (ids.length === 0) {
      return this.emit('end');
    }

    this.emit('data', wofRecords[ids.shift()]);
    callback();

  });

};
