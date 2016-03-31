var tape = require('tape');
var event_stream = require('event-stream');
var sep = require('path').sep;

var calculateFilePath = require('../../src/components/calculateFilePath');

function test_stream(input, testedStream, callback) {
    var input_stream = event_stream.readArray(input);
    var destination_stream = event_stream.writeArray(callback);

    input_stream.pipe(testedStream).pipe(destination_stream);
}

tape('calculateFilePath', function(test) {
  test.test('undefined/blank values should return false', function(t) {
    var input = [
      {
        id: 1234567
      },
      {
        id: 12345678
      },
      {
        id: 123456789
      }
    ];

    var expected = [
      ['123', '456', '7', '1234567.geojson'].join(sep),
      ['123', '456', '78', '12345678.geojson'].join(sep),
      ['123', '456', '789', '123456789.geojson'].join(sep)
    ];

    var filter = calculateFilePath.create();

    test_stream(input, filter, function(err, actual) {
      t.deepEqual(actual, expected, 'should have returned true');
      t.end();
    });

  });

});
