var tape = require('tape');
var wofRecordStream = require('../src/wofRecordStream');

tape('wofRecordStream', function(test) {
  test.test('createWofRecordsStream should iterate over all records', function(t) {
    var wofRecords = {
      1: {
        id: 11
      },
      2: {
        id: 12
      }
    };

    // create a recordStream from wofRecords
    var recordStream = wofRecordStream.createWofRecordsStream(wofRecords);

    // set expectedResults to be all the values of wofRecords
    var expectedResults = Object
      .keys(wofRecords)
      .map(function(id) { return wofRecords[id]; });

    recordStream
      .on('data', function(actualResult) {
        t.deepEqual(actualResult, expectedResults.shift());
      })
      .on('finish', function() {
        t.equal(expectedResults.length, 0, 'there should be no wofRecords left');
      });

    t.end();

  });

});
