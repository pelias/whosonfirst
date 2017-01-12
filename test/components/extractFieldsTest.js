var tape = require('tape');
var event_stream = require('event-stream');

var extractFields = require('../../src/components/extractFields');

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
  test.test('extractFields should return an object with only desired properties', function(t) {
    var input = [
      {
        id: 12345,
        ignoreField1: 'ignoreField1',
        ignoreField2: 'ignoreField2',
        properties: {
          'wof:name': 'name 1',
          'wof:placetype': 'place type 1',
          'geom:latitude': 12.121212,
          'geom:longitude': 21.212121,
          'geom:bbox': '-13.691314,49.909613,1.771169,60.847886',
          'wof:hierarchy': [
            {
              'country_id': 12345
            },
            {
              'country_id': 23456
            }
          ],
          'wof:abbreviation': 'XY',
          'gn:population': 98765,
          'misc:photo_sum': 87654,
          ignoreField3: 'ignoreField3',
          ignoreField4: 'ignoreField4',
        }
      }
    ];

    var expected = [
      {
        id: 12345,
        name: 'name 1',
        place_type: 'place type 1',
        lat: 12.121212,
        lon: 21.212121,
        population: 98765,
        popularity: 87654,
        abbreviation: 'XY',
        bounding_box: '-13.691314,49.909613,1.771169,60.847886',
        hierarchies: [
          {
            'country_id': 12345
          },
          {
            'country_id': 23456
          }
        ]
      }
    ];

    test_stream(input, extractFields.create(), function(err, actual) {
      t.deepEqual(actual, expected, 'stream should contain only objects with id and properties');
      t.end();
    });

  });

  test.test('missing fields should return undefined and empty array for hierarchies', function(t) {
    var input = [
      {
        id: 23456,
        properties: {}
      }
    ];

    var expected = [
      {
        id: 23456,
        name: undefined,
        place_type: undefined,
        lat: undefined,
        lon: undefined,
        population: undefined,
        popularity: undefined,
        abbreviation: undefined,
        bounding_box: undefined,
        hierarchies: []
      }
    ];

    test_stream(input, extractFields.create(), function(err, actual) {
      t.deepEqual(actual, expected, 'stream should contain only objects with id and properties');
      t.end();
    });

  });

  test.test('gn:population should be favored over zs:pop10 when both are available', function(t) {
    var input = [
      {
        id: 12345,
        properties: {
          'wof:name': 'name 1',
          'wof:placetype': 'place type 1',
          'geom:latitude': 12.121212,
          'geom:longitude': 21.212121,
          'geom:bbox': '-13.691314,49.909613,1.771169,60.847886',
          'wof:abbreviation': 'XY',
          'gn:population': 98765,
          'zs:pop10': 87654
        }
      }
    ];

    var expected = [
      {
        id: 12345,
        name: 'name 1',
        place_type: 'place type 1',
        lat: 12.121212,
        lon: 21.212121,
        population: 98765,
        popularity: undefined,
        abbreviation: 'XY',
        bounding_box: '-13.691314,49.909613,1.771169,60.847886',
        hierarchies: []
      }
    ];

    test_stream(input, extractFields.create(), function(err, actual) {
      t.deepEqual(actual, expected, 'population should not be set');
      t.end();
    });

  });

  test.test('non-0 zs:pop10 should be used for population when gn:population is not found', function(t) {
    var input = [
      {
        id: 12345,
        properties: {
          'wof:name': 'name 1',
          'wof:placetype': 'place type 1',
          'geom:latitude': 12.121212,
          'geom:longitude': 21.212121,
          'geom:bbox': '-13.691314,49.909613,1.771169,60.847886',
          'wof:abbreviation': 'XY',
          'zs:pop10': 98765
        }
      }
    ];

    var expected = [
      {
        id: 12345,
        name: 'name 1',
        place_type: 'place type 1',
        lat: 12.121212,
        lon: 21.212121,
        population: 98765,
        popularity: undefined,
        abbreviation: 'XY',
        bounding_box: '-13.691314,49.909613,1.771169,60.847886',
        hierarchies: []
      }
    ];

    test_stream(input, extractFields.create(), function(err, actual) {
      t.deepEqual(actual, expected, 'population should not be set');
      t.end();
    });

  });

  test.test('non-0 qs:pop should be used for population when gn:population or zs:pop10 are not found', function(t) {
    var input = [
      {
        id: 12345,
        properties: {
          'wof:name': 'name 1',
          'wof:placetype': 'place type 1',
          'geom:latitude': 12.121212,
          'geom:longitude': 21.212121,
          'geom:bbox': '-13.691314,49.909613,1.771169,60.847886',
          'wof:abbreviation': 'XY',
          'qs:pop': 98765
        }
      }
    ];

    var expected = [
      {
        id: 12345,
        name: 'name 1',
        place_type: 'place type 1',
        lat: 12.121212,
        lon: 21.212121,
        population: 98765,
        popularity: undefined,
        abbreviation: 'XY',
        bounding_box: '-13.691314,49.909613,1.771169,60.847886',
        hierarchies: []
      }
    ];

    test_stream(input, extractFields.create(), function(err, actual) {
      t.deepEqual(actual, expected, 'population should not be set');
      t.end();
    });

  });

  test.test('non-0 mz:population should be used for population when gn:population, zs:pop10 or qs:pop are not found', function(t) {
    var input = [
      {
        id: 12345,
        properties: {
          'wof:name': 'name 1',
          'wof:placetype': 'place type 1',
          'geom:latitude': 12.121212,
          'geom:longitude': 21.212121,
          'geom:bbox': '-13.691314,49.909613,1.771169,60.847886',
          'wof:abbreviation': 'XY',
          'mz:population': 98765
        }
      }
    ];

    var expected = [
      {
        id: 12345,
        name: 'name 1',
        place_type: 'place type 1',
        lat: 12.121212,
        lon: 21.212121,
        population: 98765,
        popularity: undefined,
        abbreviation: 'XY',
        bounding_box: '-13.691314,49.909613,1.771169,60.847886',
        hierarchies: []
      }
    ];

    test_stream(input, extractFields.create(), function(err, actual) {
      t.deepEqual(actual, expected, 'population should not be set');
      t.end();
    });

  });

  test.test('0 value zs:pop10 and gn:popuation not found should not set population', function(t) {
    var input = [
      {
        id: 12345,
        properties: {
          'wof:name': 'name 1',
          'wof:placetype': 'place type 1',
          'geom:latitude': 12.121212,
          'geom:longitude': 21.212121,
          'geom:bbox': '-13.691314,49.909613,1.771169,60.847886',
          'wof:abbreviation': 'XY',
          'zs:pop10': 0
        }
      }
    ];

    var expected = [
      {
        id: 12345,
        name: 'name 1',
        place_type: 'place type 1',
        lat: 12.121212,
        lon: 21.212121,
        population: undefined,
        popularity: undefined,
        abbreviation: 'XY',
        bounding_box: '-13.691314,49.909613,1.771169,60.847886',
        hierarchies: []
      }
    ];

    test_stream(input, extractFields.create(), function(err, actual) {
      t.deepEqual(actual, expected, 'population should not be set');
      t.end();
    });

  });

  test.test('neither gn:population nor zs:pop10 not found should not include population', function(t) {
    var input = [
      {
        id: 12345,
        properties: {
          'wof:name': 'name 1',
          'wof:placetype': 'place type 1',
          'geom:latitude': 12.121212,
          'geom:longitude': 21.212121,
          'geom:bbox': '-13.691314,49.909613,1.771169,60.847886',
          'wof:abbreviation': 'XY'
        }
      }
    ];

    var expected = [
      {
        id: 12345,
        name: 'name 1',
        place_type: 'place type 1',
        lat: 12.121212,
        lon: 21.212121,
        population: undefined,
        popularity: undefined,
        abbreviation: 'XY',
        bounding_box: '-13.691314,49.909613,1.771169,60.847886',
        hierarchies: []
      }
    ];

    test_stream(input, extractFields.create(), function(err, actual) {
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
          'geom:latitude': 12.121212,
          'geom:longitude': 21.212121,
          'geom:bbox': '-13.691314,49.909613,1.771169,60.847886',
          'wof:abbreviation': 'XY'
        }
      }
    ];

    var expected = [
      {
        id: 12345,
        name: 'name 1',
        place_type: 'place type 1',
        lat: 12.121212,
        lon: 21.212121,
        population: undefined,
        popularity: undefined,
        abbreviation: 'XY',
        bounding_box: '-13.691314,49.909613,1.771169,60.847886',
        hierarchies: []
      }
    ];

    test_stream(input, extractFields.create(), function(err, actual) {
      t.deepEqual(actual, expected, 'popularity should not be set');
      t.end();
    });

  });

  test.test('wof:placetype=county and wof:country=US should use qs:a2_alt for name', function(t) {
    var input = [
      {
        id: 12345,
        properties: {
          'wof:name': 'wof:name value',
          'wof:placetype': 'county',
          'geom:latitude': 12.121212,
          'geom:longitude': 21.212121,
          'iso:country': 'US',
          'wof:country': 'US',
          'qs:a2_alt': 'qs:a2_alt value'
        }
      }
    ];

    var expected = [
      {
        id: 12345,
        name: 'qs:a2_alt value',
        place_type: 'county',
        lat: 12.121212,
        lon: 21.212121,
        population: undefined,
        popularity: undefined,
        bounding_box: undefined,
        abbreviation: undefined,
        hierarchies: []
      }
    ];

    test_stream(input, extractFields.create(), function(err, actual) {
      t.deepEqual(actual, expected, 'qs:a2_alt should be used for name');
      t.end();
    });

  });

  test.test('wof:placetype=county and iso2:country=US should use wof:name for name when qs:a2_alt is undefined', function(t) {
    var input = [
      {
        id: 12345,
        properties: {
          'wof:name': 'wof:name value',
          'wof:placetype': 'county',
          'geom:latitude': 12.121212,
          'geom:longitude': 21.212121,
          'iso:country': 'US'
        }
      }
    ];

    var expected = [
      {
        id: 12345,
        name: 'wof:name value',
        place_type: 'county',
        lat: 12.121212,
        lon: 21.212121,
        population: undefined,
        popularity: undefined,
        bounding_box: undefined,
        abbreviation: undefined,
        hierarchies: []
      }
    ];

    test_stream(input, extractFields.create(), function(err, actual) {
      t.deepEqual(actual, expected, 'wof:name should be used for name');
      t.end();
    });

  });

  test.test('wof:placetype=county and iso2:country!=US should use wof:name for name', function(t) {
    var input = [
      {
        id: 12345,
        properties: {
          'wof:name': 'wof:name value',
          'wof:placetype': 'county',
          'geom:latitude': 12.121212,
          'geom:longitude': 21.212121,
          'iso:country': 'not US',
          'qs:a2_alt': 'qs:a2_alt value'
        }
      }
    ];

    var expected = [
      {
        id: 12345,
        name: 'wof:name value',
        place_type: 'county',
        lat: 12.121212,
        lon: 21.212121,
        population: undefined,
        popularity: undefined,
        bounding_box: undefined,
        abbreviation: undefined,
        hierarchies: []
      }
    ];

    test_stream(input, extractFields.create(), function(err, actual) {
      t.deepEqual(actual, expected, 'wof:name should be used for name');
      t.end();
    });

  });

  test.test('label centroid should take precedence over math centroid', function(t) {
    var input = [
      {
        id: 12345,
        properties: {
          'wof:name': 'wof:name value',
          'geom:latitude': 12.121212,
          'geom:longitude': 21.212121,
          'lbl:latitude': 14.141414,
          'lbl:longitude': 23.232323
        }
      }
    ];

    var expected = [
      {
        id: 12345,
        name: 'wof:name value',
        place_type: undefined,
        lat: 14.141414,
        lon: 23.232323,
        population: undefined,
        popularity: undefined,
        bounding_box: undefined,
        abbreviation: undefined,
        hierarchies: []
      }
    ];

    test_stream(input, extractFields.create(), function(err, actual) {
      t.deepEqual(actual, expected, 'label geometry is used');
      t.end();
    });
  });

  test.test('label bounding box should take precedence over math bounding box', function(t) {
    var input = [
      {
        id: 12345,
        properties: {
          'wof:name': 'wof:name value',
          'geom:latitude': 12.121212,
          'geom:longitude': 21.212121,
          'geom:bbox': '-13.691314,49.909613,1.771169,60.847886',
          'lbl:bbox': '-14.691314,50.909613,2.771169,61.847886'
        }
      }
    ];

    var expected = [
      {
        id: 12345,
        name: 'wof:name value',
        place_type: undefined,
        lat: 12.121212,
        lon: 21.212121,
        population: undefined,
        popularity: undefined,
        bounding_box: '-14.691314,50.909613,2.771169,61.847886',
        abbreviation: undefined,
        hierarchies: []
      }
    ];

    test_stream(input, extractFields.create(), function(err, actual) {
      t.deepEqual(actual, expected, 'label geometry is used');
      t.end();
    });
  });

  test.test('label bounding box should take precedence over math bounding box even if empty', function(t) {
    var input = [
      {
        id: 12345,
        properties: {
          'wof:name': 'wof:name value',
          'geom:latitude': 12.121212,
          'geom:longitude': 21.212121,
          'geom:bbox': '-13.691314,49.909613,1.771169,60.847886',
          'lbl:bbox': ''
        }
      }
    ];

    var expected = [
      {
        id: 12345,
        name: 'wof:name value',
        place_type: undefined,
        lat: 12.121212,
        lon: 21.212121,
        population: undefined,
        popularity: undefined,
        bounding_box: '',
        abbreviation: undefined,
        hierarchies: []
      }
    ];

    test_stream(input, extractFields.create(), function(err, actual) {
      t.deepEqual(actual, expected, 'label geometry is used');
      t.end();
    });
  });

  test.test('wof:label should be used for name when both it and wof:name are available', function(t) {
    var input = [
      {
        id: 12345,
        properties: {
          'wof:name': 'wof:name value',
          'wof:label': 'wof:label value',
          'geom:latitude': 12.121212,
          'geom:longitude': 21.212121,
          'lbl:bbox': ''
        }
      }
    ];

    var expected = [
      {
        id: 12345,
        name: 'wof:label value',
        place_type: undefined,
        lat: 12.121212,
        lon: 21.212121,
        population: undefined,
        popularity: undefined,
        bounding_box: '',
        abbreviation: undefined,
        hierarchies: []
      }
    ];

    test_stream(input, extractFields.create(), function(err, actual) {
      t.deepEqual(actual, expected, 'wof:label is used for name');
      t.end();
    });

  });

  test.test('wof:placetype=country should use wof:country value for abbreviation', function(t) {
    var input = [
      {
        id: 12345,
        properties: {
          'wof:name': 'wof:name value',
          'wof:placetype': 'country',
          'wof:country': 'XY',
          'wof:abbreviation': 'YZ'
        }
      }
    ];

    var expected = [
      {
        id: 12345,
        name: 'wof:name value',
        place_type: 'country',
        lat: undefined,
        lon: undefined,
        population: undefined,
        popularity: undefined,
        bounding_box: undefined,
        abbreviation: 'XY',
        hierarchies: []
      }
    ];

    test_stream(input, extractFields.create(), function(err, actual) {
      t.deepEqual(actual, expected, 'wof:country is used for abbreviation');
      t.end();
    });

  });

  test.test('wof:placetype=dependency should use wof:country value for abbreviation', function(t) {
    var input = [
      {
        id: 12345,
        properties: {
          'wof:name': 'wof:name value',
          'wof:placetype': 'dependency',
          'wof:country': 'XY',
          'wof:abbreviation': 'YZ'
        }
      }
    ];

    var expected = [
      {
        id: 12345,
        name: 'wof:name value',
        place_type: 'dependency',
        lat: undefined,
        lon: undefined,
        population: undefined,
        popularity: undefined,
        bounding_box: undefined,
        abbreviation: 'XY',
        hierarchies: []
      }
    ];

    test_stream(input, extractFields.create(), function(err, actual) {
      t.deepEqual(actual, expected, 'wof:country is used for abbreviation');
      t.end();
    });

  });

  test.test('wof:placetype=country should use wof:abbreviation value for abbreviation when wof:country is undefined', function(t) {
    var input = [
      {
        id: 12345,
        properties: {
          'wof:name': 'wof:name value',
          'wof:placetype': 'country',
          'wof:country': undefined,
          'wof:abbreviation': 'YZ'
        }
      }
    ];

    var expected = [
      {
        id: 12345,
        name: 'wof:name value',
        place_type: 'country',
        lat: undefined,
        lon: undefined,
        population: undefined,
        popularity: undefined,
        bounding_box: undefined,
        abbreviation: 'YZ',
        hierarchies: []
      }
    ];

    test_stream(input, extractFields.create(), function(err, actual) {
      t.deepEqual(actual, expected, 'wof:abbreviation is used for abbreviation');
      t.end();
    });

  });

});
