var tape = require('tape');
var event_stream = require('event-stream');
var fs = require('fs');
var intercept = require('intercept-stdout');
var temp = require('temp');
var path = require('path');

var fileIsReadable = require('../../src/components/fileIsReadable');

function test_stream(input, testedStream, callback) {
    var input_stream = event_stream.readArray(input);
    var destination_stream = event_stream.writeArray(callback);

    input_stream.pipe(testedStream).pipe(destination_stream);
}

tape('filterOutUnreadableFiles', function(test) {
  test.test('file existing should filter out those with paths that don\'t exist', function(t) {
    temp.track();

    var filename = temp.path();
    fs.writeFileSync(filename, '');

    var basename = path.basename(filename);
    var dirname = path.dirname(filename);

    var input = [
      { path: basename },
      { path: 'does_not_exist.txt' }
    ];

    var expected = [
      { path: basename }
    ];

    var stderr = '';

    // intercept/swallow stderr
    var unhook_intercept = intercept(
      function() { },
      function(txt) { stderr += txt; return ''; }
    );

    test_stream(input, fileIsReadable.create(dirname), function(err, actual) {
      temp.cleanupSync();
      unhook_intercept();
      t.deepEqual(actual, expected, 'should have returned true');
      t.equal(stderr, 'data file cannot be read: ' + dirname + path.sep + 'does_not_exist.txt\n');
      t.end();
    });

  });

});
