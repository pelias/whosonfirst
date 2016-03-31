var tape = require('tape');
var event_stream = require('event-stream');

var filterOutIncompleteRecords = require('../../src/components/filterOutIncompleteRecords');

function test_stream(input, testedStream, callback) {
    var input_stream = event_stream.readArray(input);
    var destination_stream = event_stream.writeArray(callback);

    input_stream.pipe(testedStream).pipe(destination_stream);
}

tape('filterOutIncompleteRecords', function(test) {
  test.test('filterOutIncompleteRecords filters objects without id and properties', function(t) {
    var input = [
      {
        id: 5,
        properties: {}
      },
      {
        not_id: 6
      }
    ];
    var expected = [
      {
        id: 5,
        properties: {}
      }
    ];

    test_stream(input, filterOutIncompleteRecords.create(), function(err, actual) {
      t.deepEqual(actual, expected, 'stream should contain only objects with id and properties');
      t.end();
    });
  });

});
