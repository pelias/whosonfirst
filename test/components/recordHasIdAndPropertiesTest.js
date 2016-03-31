var tape = require('tape');
var event_stream = require('event-stream');

var recordHasIdAndProperties = require('../../src/components/recordHasIdAndProperties');

function test_stream(input, testedStream, callback) {
    var input_stream = event_stream.readArray(input);
    var destination_stream = event_stream.writeArray(callback);

    input_stream.pipe(testedStream).pipe(destination_stream);
}

tape('recordHasIdAndProperties', function(test) {
  test.test('recordHasIdAndProperties filters objects without id and properties', function(t) {
    var input = [
      {
        id: 5,
        properties: {}
      },
      {
        not_id: 6,
        properties: {}
      },
      {
        id: 7
      }
    ];
    var expected = [
      {
        id: 5,
        properties: {}
      }
    ];

    test_stream(input, recordHasIdAndProperties.create(), function(err, actual) {
      t.deepEqual(actual, expected, 'stream should contain only objects with id and properties');
      t.end();
    });
  });

});
