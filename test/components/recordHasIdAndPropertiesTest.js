var tape = require('tape');
const stream_mock = require('stream-mock');

var recordHasIdAndProperties = require('../../src/components/recordHasIdAndProperties');

function test_stream(input, testedStream, callback) {
  const reader = new stream_mock.ObjectReadableMock(input);
  const writer = new stream_mock.ObjectWritableMock();
  writer.on('error', (e) => callback(e));
  writer.on('finish', () => callback(null, writer.data));
  reader.pipe(testedStream).pipe(writer);
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
  test.end();

});
