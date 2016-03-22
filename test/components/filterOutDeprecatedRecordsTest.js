var tape = require('tape');
var event_stream = require('event-stream');

var filterOutDeprecatedRecords = require('../../src/components/filterOutDeprecatedRecords');

function test_stream(input, testedStream, callback) {
    var input_stream = event_stream.readArray(input);
    var destination_stream = event_stream.writeArray(callback);

    input_stream.pipe(testedStream).pipe(destination_stream);
}

tape('filterOutDeprecatedRecords', function(test) {
  test.test('undefined/blank values should return false', function(t) {
    var input = [
      {
        properties: {
          'edtf:deprecated': undefined,
        }
      },
      {
        properties: {
          'edtf:deprecated': '',
        }
      },
      {
        properties: {
          'edtf:deprecated': ' \t ',
        }
      },
      {
        properties: {
        }
      }
    ];
    var expected = [
      {
        properties: {
          'edtf:deprecated': undefined,
        }
      },
      {
        properties: {
          'edtf:deprecated': '',
        }
      },
      {
        properties: {
          'edtf:deprecated': ' \t ',
        }
      },
      {
        properties: {
        }
      }
    ];

    var filter = filterOutDeprecatedRecords.create();

    test_stream(input, filter, function(err, actual) {
      t.deepEqual(actual, expected, 'should have returned true');
      t.end();
    });

  });

  test.test('non-blank values should return true', function(t) {
    var input = [
      {
        properties: {
          'edtf:deprecated': 'some value',
        }
      }
    ];
    var expected = [];

    var filter = filterOutDeprecatedRecords.create();

    test_stream(input, filter, function(err, actual) {
      t.deepEqual(actual, expected, 'should have returned true');
      t.end();
    });

  });



});
