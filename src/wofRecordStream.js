var event_stream = require('event-stream');

module.exports = {};

/*
  This function returns a stream that emits all the ids in wofRecords.

  For example, if wofRecords is:

  {
    1: {},
    2: {},
    3: {}
  }

  then the stream will emit:

  `1`, `2`, `3`

*/
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
