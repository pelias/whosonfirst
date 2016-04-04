var tape = require('tape');
var event_stream = require('event-stream');

var isValidId = require('../../src/components/isValidId');

function test_stream(input, testedStream, callback) {
    var input_stream = event_stream.readArray(input);
    var destination_stream = event_stream.writeArray(callback);

    input_stream.pipe(testedStream).pipe(destination_stream);
}

tape('isValidId', function(test) {
  test.test('only ids of length > 6 should be returned', function(t) {
    var input = [
      {},
      { id: undefined },
      { id: 1 },
      { id: 12 },
      { id: 123 },
      { id: 1234 },
      { id: 12345 },
      { id: 123456 },
      { id: 1234567 },
      { id: 12345678 },
      { id: 123456789 }
    ];

    var expected = [
      { id: 1234567 },
      { id: 12345678 },
      { id: 123456789 }
    ];

    var filter = isValidId.create();

    test_stream(input, filter, function(err, actual) {
      t.deepEqual(actual, expected, 'should have returned true');
      t.end();
    });

  });

});
