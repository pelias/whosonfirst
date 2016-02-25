var tape = require('tape');
var event_stream = require('event-stream');
var fs = require('fs');
var intercept = require('intercept-stdout');
var temp = require('temp');
var path = require('path');

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
  test.test('input matching #/#/#/#.geojson pattern should return true, false otherwise', function(t) {
    var input = [
      { path: '1/2/3/4.geojson' },
      { path: 'some text 1/2/3/4.geojson' },
      { path: 'this is not even remotely valid' },
      { path: '2/3/4.geojson'},
      { path: '3/4.geojson' },
      { path: '4.geojson' }
    ];
    var expected = [
      { path: '1/2/3/4.geojson' },
      { path: 'some text 1/2/3/4.geojson' }
    ];
    var is_valid_data_file_path = readStreamComponents.is_valid_data_file_path();

    test_stream(input, is_valid_data_file_path, function(err, actual) {
      t.deepEqual(actual, expected, 'should have returned true');
      t.end();
    });

  });

  test.test('normalize_file_path should only return id portions of path', function(t) {
    var input = [
      { path: '1/2/3/4.geojson' },
      { path: 'some text 1/2/3/4.geojson' },
      { path: 'some text/1/2/3/4.geojson' }
    ];
    var expected = [
      '1/2/3/4.geojson',
      '1/2/3/4.geojson',
      '1/2/3/4.geojson'
    ];
    var normalize_file_path = readStreamComponents.normalize_file_path();

    test_stream(input, normalize_file_path, function(err, actual) {
      t.deepEqual(actual, expected, 'should have returned true');
      t.end();
    });

  });

  test.test('file existing should filter out those with paths that don\'t exist', function(t) {
    temp.track();

    var filename = temp.path();
    fs.writeFileSync(filename, '');

    var basename = path.basename(filename);
    var dirname = path.dirname(filename);

    var input = [
      basename,
      'does_not_exist.txt'
    ];

    var expected = [
      basename
    ];

    var file_is_readable = readStreamComponents.file_is_readable(dirname);

    var stderr = '';

    // intercept/swallow stderr
    var unhook_intercept = intercept(
      function() { },
      function(txt) { stderr += txt; return ''; }
    );

    test_stream(input, file_is_readable, function(err, actual) {
      temp.cleanupSync();
      unhook_intercept();
      t.deepEqual(actual, expected, 'should have returned true');
      t.equal(stderr, 'data file cannot be read: ' + dirname + path.sep + 'does_not_exist.txt\n');
      t.end();
    });

  });

  test.test('filter_incomplete_files_stream filters objects without id and properties', function(t) {
    var input = [
      {
        id: 5,
        properties: {}
      },
      {
        not_id: 6
      }
    ];
    var expected = [
      {
        id: 5,
        properties: {}
      }
    ];
    var filter_incomplete_files_stream = readStreamComponents.filter_incomplete_files_stream();

    test_stream(input, filter_incomplete_files_stream, function(err, actual) {
      t.deepEqual(actual, expected, 'stream should contain only objects with id and properties');
      t.end();
    });
  });

  test.test('map_fields_stream should return an object with only desired properties', function(t) {
    var input = [
      {
        id: 12345,
        ignoreField1: 'ignoreField1',
        ignoreField2: 'ignoreField2',
        properties: {
          'wof:name': 'name 1',
          'wof:placetype': 'place type 1',
          'wof:parent_id': 'parent id 1',
          'geom:latitude': 12.121212,
          'geom:longitude': 21.212121,
          'geom:bbox': '-13.691314,49.909613,1.771169,60.847886',
          'wof:hierarchy': [
            {
              'parent_id': 12345
            },
            {
              'parent_id': 23456
            }
          ],
          'iso:country': 'YZ',
          'wof:abbreviation': 'XY',
          'gn:population': 98765,
          'misc:photo_sum': 87654,
          ignoreField3: 'ignoreField3',
          ignoreField4: 'ignoreField4',
        }
      },
      {
        id: 23456,
        properties: {}
      }
    ];

    var expected = [
      {
        id: 12345,
        name: 'name 1',
        place_type: 'place type 1',
        parent_id: 'parent id 1',
        lat: 12.121212,
        lon: 21.212121,
        iso2: 'YZ',
        population: 98765,
        popularity: 87654,
        abbreviation: 'XY',
        bounding_box: '-13.691314,49.909613,1.771169,60.847886',
        hierarchies: [
          {
            'parent_id': 12345
          },
          {
            'parent_id': 23456
          }
        ]
      },
      {
        id: 23456,
        name: undefined,
        place_type: undefined,
        parent_id: undefined,
        lat: undefined,
        lon: undefined,
        iso2: undefined,
        population: undefined,
        popularity: undefined,
        abbreviation: undefined,
        bounding_box: undefined,
        hierarchies: []
      }
    ];
    var map_fields_stream = readStreamComponents.map_fields_stream();

    test_stream(input, map_fields_stream, function(err, actual) {
      t.deepEqual(actual, expected, 'stream should contain only objects with id and properties');
      t.end();
    });

  });

  test.test('gn:population not found should not include population', function(t) {
    var input = [
      {
        id: 12345,
        properties: {
          'wof:name': 'name 1',
          'wof:placetype': 'place type 1',
          'wof:parent_id': 'parent id 1',
          'geom:latitude': 12.121212,
          'geom:longitude': 21.212121,
          'geom:bbox': '-13.691314,49.909613,1.771169,60.847886',
          'iso:country': 'YZ',
          'wof:abbreviation': 'XY'
        }
      }
    ];

    var expected = [
      {
        id: 12345,
        name: 'name 1',
        place_type: 'place type 1',
        parent_id: 'parent id 1',
        lat: 12.121212,
        lon: 21.212121,
        iso2: 'YZ',
        population: undefined,
        popularity: undefined,
        abbreviation: 'XY',
        bounding_box: '-13.691314,49.909613,1.771169,60.847886',
        hierarchies: []
      }
    ];
    var map_fields_stream = readStreamComponents.map_fields_stream();

    test_stream(input, map_fields_stream, function(err, actual) {
      t.deepEqual(actual, expected, 'population should not be set');
      t.end();
    });

  });

  test.test('misc:photo_sum not found should not include popularity', function(t) {
    var input = [
      {
        id: 12345,
        properties: {
          'wof:name': 'name 1',
          'wof:placetype': 'place type 1',
          'wof:parent_id': 'parent id 1',
          'geom:latitude': 12.121212,
          'geom:longitude': 21.212121,
          'geom:bbox': '-13.691314,49.909613,1.771169,60.847886',
          'iso:country': 'YZ',
          'wof:abbreviation': 'XY'
        }
      }
    ];

    var expected = [
      {
        id: 12345,
        name: 'name 1',
        place_type: 'place type 1',
        parent_id: 'parent id 1',
        lat: 12.121212,
        lon: 21.212121,
        iso2: 'YZ',
        population: undefined,
        popularity: undefined,
        abbreviation: 'XY',
        bounding_box: '-13.691314,49.909613,1.771169,60.847886',
        hierarchies: []
      }
    ];
    var map_fields_stream = readStreamComponents.map_fields_stream();

    test_stream(input, map_fields_stream, function(err, actual) {
      t.deepEqual(actual, expected, 'popularity should not be set');
      t.end();
    });

  });

  test.test('json_parse_stream should return an empty object if the file is not json', function(t) {
    var input = ['this_is_not_json.json'];
    var expected = [{}];

    var stderr = '';

    // intercept/swallow stderr
    var unhook_intercept = intercept(
      function() { },
      function(txt) { stderr += txt; return ''; }
    );

    fs.writeFileSync(input[0], 'this is not JSON');

    var json_parse_stream = readStreamComponents.json_parse_stream('./');

    test_stream(input, json_parse_stream, function(err, actual) {
      t.deepEqual(actual, expected, 'an empty object should have been returned');
      t.equal(stderr, 'exception on this_is_not_json.json: [SyntaxError: Unexpected token h]\n');
      t.end();
      unhook_intercept();
      fs.unlinkSync(input[0]);
    });

  });

  test.test('json_parse_stream should parse filename and return parsed object', function(t) {
    var input = ['parse_stream_test.json'];

    var expected = [{
      field1: 'value1',
      field2: 'value2',
      nested: {
        field3: 'value3',
        field4: 'value4'
      },
      array: ['value5', 'value6']
    }];

    fs.writeFileSync(input[0], JSON.stringify(expected[0]) + '\n');

    var json_parse_stream = readStreamComponents.json_parse_stream('./');

    test_stream(input, json_parse_stream, function(err, actual) {
      t.deepEqual(actual, expected, 'stream should contain only objects with id and properties');
      t.end();
      fs.unlinkSync(input[0]);
    });

  });

});
