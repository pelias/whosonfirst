var tape = require('tape');
var event_stream = require('event-stream');
var intercept = require('intercept-stdout');
var fs = require('fs');

var loadJSON = require('../../src/components/loadJSON');

function test_stream(input, testedStream, callback) {
    var input_stream = event_stream.readArray(input);
    var destination_stream = event_stream.writeArray(callback);

    input_stream.pipe(testedStream).pipe(destination_stream);
}

tape('loadJSON', function(test) {
  test.test('json_parse_stream should return an empty object if the file is not json', function(t) {
    var input = [
      {
        path: 'this_is_not_json.json'
      }
    ];
    var expected = [{}];

    var stderr = '';

    // intercept/swallow stderr
    var unhook_intercept = intercept(
      function() { },
      function(txt) { stderr += txt; return ''; }
    );

    fs.writeFileSync(input[0].path, 'this is not JSON');

    test_stream(input, loadJSON.create('./'), function(err, actual) {
      t.deepEqual(actual, expected, 'an empty object should have been returned');
      t.equal(stderr, 'exception on this_is_not_json.json: [SyntaxError: Unexpected token h]\n');
      t.end();
      unhook_intercept();
      fs.unlinkSync(input[0].path);
    });

  });

  test.test('json_parse_stream should parse filename and return parsed object', function(t) {
    var input = [
      {
        path: 'parse_stream_test.json'
      }
    ];

    var expected = [{
      field1: 'value1',
      field2: 'value2',
      nested: {
        field3: 'value3',
        field4: 'value4'
      },
      array: ['value5', 'value6']
    }];

    fs.writeFileSync(input[0].path, JSON.stringify(expected[0]) + '\n');

    test_stream(input, loadJSON.create('./'), function(err, actual) {
      t.deepEqual(actual, expected, 'stream should contain only objects with id and properties');
      t.end();
      fs.unlinkSync(input[0].path);
    });

  });

});
