var tape = require('tape');
var event_stream = require('event-stream');

var readStreamComponents = require('../src/readStreamComponents');

/*
 * Test a stream with the following process:
 * 1. take input as array
 * 2. turn the array into a stream
 * 3. pipe through stream to be tested
 * 4. pass output of that stream to a callback function
 * 5. assertions can then be made in that callback
 *
 * Callback signature should be something like function callback(error, result)
 */
function test_stream(input, testedStream, callback) {
    var input_stream = event_stream.readArray(input);
    var destination_stream = event_stream.writeArray(callback);

    input_stream.pipe(testedStream).pipe(destination_stream);
}

tape('readStreamComponents', function(test) {
  test.test('filter_bad_files_stream filters objects without id and properties', function(t) {
    var input = [{ id: 5, properties: {}}, { not_id: 6 }];
    var expected = [{id: 5, properties: {} }];
    var filter_bad_files_stream = readStreamComponents.filter_bad_files_stream();

    test_stream(input, filter_bad_files_stream, function(err, actual) {
      t.deepEqual(actual, expected, 'stream should contain only objects with id and properties');
      t.end();
    });
  });
});
