var tape = require('tape');
var event_stream = require('event-stream');

var isActiveRecord = require('../../src/components/isActiveRecord');

function test_stream(input, testedStream, callback) {
    var input_stream = event_stream.readArray(input);
    var destination_stream = event_stream.writeArray(callback);

    input_stream.pipe(testedStream).pipe(destination_stream);
}

tape('isActiveRecord', function(test) {
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

    test_stream(input, isActiveRecord.create(), function(err, actual) {
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

    test_stream(input, isActiveRecord.create(), function(err, actual) {
      t.deepEqual(actual, expected, 'should have returned true');
      t.end();
    });

  });



});
