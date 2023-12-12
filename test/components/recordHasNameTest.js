var tape = require('tape');
var stream_mock = require('stream-mock');

var recordHasName = require('../../src/components/recordHasName');

function test_stream(input, testedStream, callback) {
  const reader = new stream_mock.ObjectReadableMock(input);
  const writer = new stream_mock.ObjectWritableMock();
  writer.on('error', (e) => callback(e));
  writer.on('finish', () => callback(null, writer.data));
  reader.pipe(testedStream).pipe(writer);
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
