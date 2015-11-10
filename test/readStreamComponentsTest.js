var tape = require('tape');
var event_stream = require('event-stream');
var stream_array = require('stream-array');

var readStreamComponents = require('../src/readStreamComponents');

tape('readStreamComponents', function(test) {
  test.test('filter_bad_files_stream filters objects without id and properties', function(t) {
    var input = [{ id: 5, properties: {}}, { not_id: 6 }];
    var expected = [{id: 5, properties: {} }];
    var filter_bad_files_stream = readStreamComponents.filter_bad_files_stream();
    var input_stream = stream_array(input);
    var destination_stream = event_stream.writeArray(function(err, actual) {
      console.log(actual);
      t.deepEqual(actual, expected, 'stream should contain only objects with id and properties');
      t.end();
    });

    input_stream.pipe(filter_bad_files_stream).pipe(destination_stream);
  });
});
