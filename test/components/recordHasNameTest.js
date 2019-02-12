var tape = require('tape');
var event_stream = require('event-stream');

var recordHasName = require('../../src/components/recordHasName');

function test_stream(input, testedStream, callback) {
    var input_stream = event_stream.readArray(input);
    var destination_stream = event_stream.writeArray(callback);

    input_stream.pipe(testedStream).pipe(destination_stream);
}

tape('recordHasName', function(test) {
  test.test('undefined/blank names should return false', function(t) {
    var input = [
      { name: undefined },
      { name: '' },
      { name: ' \t '}
    ];
    var expected = [];

    var filter = recordHasName.create();

    test_stream(input, filter, function(err, actual) {
      t.deepEqual(actual, expected, 'should have returned true');
      t.end();
    });

  });

  test.test('non-blank names should return true', function(t) {
    var input = [
      { name: 'name' }
    ];
    var expected = [
      { name: 'name' }
    ];

    var filter = recordHasName.create();

    test_stream(input, filter, function(err, actual) {
      t.deepEqual(actual, expected, 'should have returned true');
      t.end();
    });

  });
  test.end();

});
