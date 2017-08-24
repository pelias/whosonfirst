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
        popularity: 87654,
        population: undefined,
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
          'wof:country': 'value from wof:country',
          'wof:abbreviation': 'value from wof:abbreviation'
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
        abbreviation: 'value from wof:abbreviation',
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

tape('population fallback tests', (test) => {
  test.test('mz:population should be used for population above all others', (t) => {
    var input = [
      {
        id: 12345,
        properties: {
          'wof:name': 'wof:name value',
          'wof:placetype': 'country',
          'mz:population': 10,
          'wof:population': 11,
          'wk:population': 12,
          'gn:population': 13,
          'gn:pop': 14,
          'qs:pop': 15,
          'qs:gn_pop': 16,
          'zs:pop10': 17,
          'meso:pop': 18,
          'statoids:population': 19,
          'ne:pop_est': 20
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
        population: 10,
        popularity: undefined,
        bounding_box: undefined,
        abbreviation: undefined,
        hierarchies: []
      }
    ];

    test_stream(input, extractFields.create(), (err, actual) => {
      t.deepEqual(actual, expected, 'mz:population');
      t.end();
    });

  });

  test.test('wof:population should be used for population when higher-ranked aren\'t available', (t) => {
    var input = [
      {
        id: 12345,
        properties: {
          'wof:name': 'wof:name value',
          'wof:placetype': 'country',
          'wof:population': 11,
          'wk:population': 12,
          'gn:population': 13,
          'gn:pop': 14,
          'qs:pop': 15,
          'qs:gn_pop': 16,
          'zs:pop10': 17,
          'meso:pop': 18,
          'statoids:population': 19,
          'ne:pop_est': 20
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
        population: 11,
        popularity: undefined,
        bounding_box: undefined,
        abbreviation: undefined,
        hierarchies: []
      }
    ];

    test_stream(input, extractFields.create(), (err, actual) => {
      t.deepEqual(actual, expected, 'wof:population');
      t.end();
    });

  });

  test.test('wk:population should be used for population when higher-ranked aren\'t available', (t) => {
    var input = [
      {
        id: 12345,
        properties: {
          'wof:name': 'wof:name value',
          'wof:placetype': 'country',
          'wk:population': 12,
          'gn:population': 13,
          'gn:pop': 14,
          'qs:pop': 15,
          'qs:gn_pop': 16,
          'zs:pop10': 17,
          'meso:pop': 18,
          'statoids:population': 19,
          'ne:pop_est': 20
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
        population: 12,
        popularity: undefined,
        bounding_box: undefined,
        abbreviation: undefined,
        hierarchies: []
      }
    ];

    test_stream(input, extractFields.create(), (err, actual) => {
      t.deepEqual(actual, expected, 'wk:population');
      t.end();
    });

  });

  test.test('gn:population should be used for population when higher-ranked aren\'t available', (t) => {
    var input = [
      {
        id: 12345,
        properties: {
          'wof:name': 'wof:name value',
          'wof:placetype': 'country',
          'gn:population': 13,
          'gn:pop': 14,
          'qs:pop': 15,
          'qs:gn_pop': 16,
          'zs:pop10': 17,
          'meso:pop': 18,
          'statoids:population': 19,
          'ne:pop_est': 20
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
        population: 13,
        popularity: undefined,
        bounding_box: undefined,
        abbreviation: undefined,
        hierarchies: []
      }
    ];

    test_stream(input, extractFields.create(), (err, actual) => {
      t.deepEqual(actual, expected, 'gn:population');
      t.end();
    });

  });

  test.test('gn:pop should be used for population when higher-ranked aren\'t available', (t) => {
    var input = [
      {
        id: 12345,
        properties: {
          'wof:name': 'wof:name value',
          'wof:placetype': 'country',
          'gn:pop': 14,
          'qs:pop': 15,
          'qs:gn_pop': 16,
          'zs:pop10': 17,
          'meso:pop': 18,
          'statoids:population': 19,
          'ne:pop_est': 20
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
        population: 14,
        popularity: undefined,
        bounding_box: undefined,
        abbreviation: undefined,
        hierarchies: []
      }
    ];

    test_stream(input, extractFields.create(), (err, actual) => {
      t.deepEqual(actual, expected, 'gn:pop');
      t.end();
    });

  });

  test.test('qs:pop should be used for population when higher-ranked aren\'t available', (t) => {
    var input = [
      {
        id: 12345,
        properties: {
          'wof:name': 'wof:name value',
          'wof:placetype': 'country',
          'qs:pop': 15,
          'qs:gn_pop': 16,
          'zs:pop10': 17,
          'meso:pop': 18,
          'statoids:population': 19,
          'ne:pop_est': 20
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
        population: 15,
        popularity: undefined,
        bounding_box: undefined,
        abbreviation: undefined,
        hierarchies: []
      }
    ];

    test_stream(input, extractFields.create(), (err, actual) => {
      t.deepEqual(actual, expected, 'qs:pop');
      t.end();
    });

  });

  test.test('qs:gn_pop should be used for population when higher-ranked aren\'t available', (t) => {
    var input = [
      {
        id: 12345,
        properties: {
          'wof:name': 'wof:name value',
          'wof:placetype': 'country',
          'qs:gn_pop': 16,
          'zs:pop10': 17,
          'meso:pop': 18,
          'statoids:population': 19,
          'ne:pop_est': 20
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
        population: 16,
        popularity: undefined,
        bounding_box: undefined,
        abbreviation: undefined,
        hierarchies: []
      }
    ];

    test_stream(input, extractFields.create(), (err, actual) => {
      t.deepEqual(actual, expected, 'qs:gn_pop');
      t.end();
    });

  });

  test.test('zs:pop10 should be used for population when higher-ranked aren\'t available', (t) => {
    var input = [
      {
        id: 12345,
        properties: {
          'wof:name': 'wof:name value',
          'wof:placetype': 'country',
          'zs:pop10': 17,
          'meso:pop': 18,
          'statoids:population': 19,
          'ne:pop_est': 20
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
        population: 17,
        popularity: undefined,
        bounding_box: undefined,
        abbreviation: undefined,
        hierarchies: []
      }
    ];

    test_stream(input, extractFields.create(), (err, actual) => {
      t.deepEqual(actual, expected, 'zs:pop10');
      t.end();
    });

  });

  test.test('meso:pop should be used for population when higher-ranked aren\'t available', (t) => {
    var input = [
      {
        id: 12345,
        properties: {
          'wof:name': 'wof:name value',
          'wof:placetype': 'country',
          'meso:pop': 18,
          'statoids:population': 19,
          'ne:pop_est': 20
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
        population: 18,
        popularity: undefined,
        bounding_box: undefined,
        abbreviation: undefined,
        hierarchies: []
      }
    ];

    test_stream(input, extractFields.create(), (err, actual) => {
      t.deepEqual(actual, expected, 'meso:pop');
      t.end();
    });

  });

  test.test('statoids:population should be used for population when higher-ranked aren\'t available', (t) => {
    var input = [
      {
        id: 12345,
        properties: {
          'wof:name': 'wof:name value',
          'wof:placetype': 'country',
          'statoids:population': 19,
          'ne:pop_est': 20
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
        population: 19,
        popularity: undefined,
        bounding_box: undefined,
        abbreviation: undefined,
        hierarchies: []
      }
    ];

    test_stream(input, extractFields.create(), (err, actual) => {
      t.deepEqual(actual, expected, 'statoids:population');
      t.end();
    });

  });

  test.test('ne:pop_est should be used for population when higher-ranked aren\'t available', (t) => {
    var input = [
      {
        id: 12345,
        properties: {
          'wof:name': 'wof:name value',
          'wof:placetype': 'country',
          'ne:pop_est': 20
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
        population: 20,
        popularity: undefined,
        bounding_box: undefined,
        abbreviation: undefined,
        hierarchies: []
      }
    ];

    test_stream(input, extractFields.create(), (err, actual) => {
      t.deepEqual(actual, expected, 'ne:pop_est');
      t.end();
    });

  });

  test.test('population should be undefined when no recognized population fields are available', (t) => {
    var input = [
      {
        id: 12345,
        properties: {
          'wof:name': 'wof:name value',
          'wof:placetype': 'country'
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
        abbreviation: undefined,
        hierarchies: []
      }
    ];

    test_stream(input, extractFields.create(), (err, actual) => {
      t.deepEqual(actual, expected, 'should be undefined');
      t.end();
    });

  });

  test.test('string population fields should be converted to integer', (t) => {
    var input = [
      {
        id: 12345,
        properties: {
          'wof:name': 'wof:name value',
          'wof:placetype': 'country',
          'mz:population': '10',
          'wof:population': 11,
          'wk:population': 12,
          'gn:population': 13,
          'gn:pop': 14,
          'qs:pop': 15,
          'qs:gn_pop': 16,
          'zs:pop10': 17,
          'meso:pop': 18,
          'statoids:population': 19,
          'ne:pop_est': 20
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
        population: 10,
        popularity: undefined,
        bounding_box: undefined,
        abbreviation: undefined,
        hierarchies: []
      }
    ];

    test_stream(input, extractFields.create(), (err, actual) => {
      t.deepEqual(actual, expected, 'mz:population');
      t.end();
    });

  });

  test.test('unparseable-as-integer population fields should be skipped', (t) => {
    var input = [
      {
        id: 12345,
        properties: {
          'wof:name': 'wof:name value',
          'wof:placetype': 'country',
          'mz:population': 'this cannot be parsed an integer',
          'wof:population': 11,
          'wk:population': 12,
          'gn:population': 13,
          'gn:pop': 14,
          'qs:pop': 15,
          'qs:gn_pop': 16,
          'zs:pop10': 17,
          'meso:pop': 18,
          'statoids:population': 19,
          'ne:pop_est': 20
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
        population: 11,
        popularity: undefined,
        bounding_box: undefined,
        abbreviation: undefined,
        hierarchies: []
      }
    ];

    test_stream(input, extractFields.create(), (err, actual) => {
      t.deepEqual(actual, expected, 'wof:population');
      t.end();
    });

  });

});

tape('negative population fallback tests', (test) => {
  test.test('wof:population should be used for population when higher-ranked are unavailable/negative', (t) => {
    var input = [
      {
        id: 12345,
        properties: {
          'wof:name': 'wof:name value',
          'wof:placetype': 'country',
          'mz:population': -1,
          'wof:population': 11,
          'wk:population': 12,
          'gn:population': 13,
          'gn:pop': 14,
          'qs:pop': 15,
          'qs:gn_pop': 16,
          'zs:pop10': 17,
          'meso:pop': 18,
          'statoids:population': 19,
          'ne:pop_est': 20
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
        population: 11,
        popularity: undefined,
        bounding_box: undefined,
        abbreviation: undefined,
        hierarchies: []
      }
    ];

    test_stream(input, extractFields.create(), (err, actual) => {
      t.deepEqual(actual, expected, 'wof:population');
      t.end();
    });

  });

  test.test('wk:population should be used for population when higher-ranked are unavailable/negative', (t) => {
    var input = [
      {
        id: 12345,
        properties: {
          'wof:name': 'wof:name value',
          'wof:placetype': 'country',
          'wof:population': -1,
          'wk:population': 12,
          'gn:population': 13,
          'gn:pop': 14,
          'qs:pop': 15,
          'qs:gn_pop': 16,
          'zs:pop10': 17,
          'meso:pop': 18,
          'statoids:population': 19,
          'ne:pop_est': 20
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
        population: 12,
        popularity: undefined,
        bounding_box: undefined,
        abbreviation: undefined,
        hierarchies: []
      }
    ];

    test_stream(input, extractFields.create(), (err, actual) => {
      t.deepEqual(actual, expected, 'wk:population');
      t.end();
    });

  });

  test.test('gn:population should be used for population when higher-ranked are unavailable/negative', (t) => {
    var input = [
      {
        id: 12345,
        properties: {
          'wof:name': 'wof:name value',
          'wof:placetype': 'country',
          'wk:population': -1,
          'gn:population': 13,
          'gn:pop': 14,
          'qs:pop': 15,
          'qs:gn_pop': 16,
          'zs:pop10': 17,
          'meso:pop': 18,
          'statoids:population': 19,
          'ne:pop_est': 20
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
        population: 13,
        popularity: undefined,
        bounding_box: undefined,
        abbreviation: undefined,
        hierarchies: []
      }
    ];

    test_stream(input, extractFields.create(), (err, actual) => {
      t.deepEqual(actual, expected, 'gn:population');
      t.end();
    });

  });

  test.test('gn:pop should be used for population when higher-ranked are unavailable/negative', (t) => {
    var input = [
      {
        id: 12345,
        properties: {
          'wof:name': 'wof:name value',
          'wof:placetype': 'country',
          'gn:population': -1,
          'gn:pop': 14,
          'qs:pop': 15,
          'qs:gn_pop': 16,
          'zs:pop10': 17,
          'meso:pop': 18,
          'statoids:population': 19,
          'ne:pop_est': 20
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
        population: 14,
        popularity: undefined,
        bounding_box: undefined,
        abbreviation: undefined,
        hierarchies: []
      }
    ];

    test_stream(input, extractFields.create(), (err, actual) => {
      t.deepEqual(actual, expected, 'gn:pop');
      t.end();
    });

  });

  test.test('qs:pop should be used for population when higher-ranked are unavailable/negative', (t) => {
    var input = [
      {
        id: 12345,
        properties: {
          'wof:name': 'wof:name value',
          'wof:placetype': 'country',
          'gn:pop': -1,
          'qs:pop': 15,
          'qs:gn_pop': 16,
          'zs:pop10': 17,
          'meso:pop': 18,
          'statoids:population': 19,
          'ne:pop_est': 20
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
        population: 15,
        popularity: undefined,
        bounding_box: undefined,
        abbreviation: undefined,
        hierarchies: []
      }
    ];

    test_stream(input, extractFields.create(), (err, actual) => {
      t.deepEqual(actual, expected, 'qs:pop');
      t.end();
    });

  });

  test.test('qs:gn_pop should be used for population when higher-ranked are unavailable/negative', (t) => {
    var input = [
      {
        id: 12345,
        properties: {
          'wof:name': 'wof:name value',
          'wof:placetype': 'country',
          'qs:pop': -1,
          'qs:gn_pop': 16,
          'zs:pop10': 17,
          'meso:pop': 18,
          'statoids:population': 19,
          'ne:pop_est': 20
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
        population: 16,
        popularity: undefined,
        bounding_box: undefined,
        abbreviation: undefined,
        hierarchies: []
      }
    ];

    test_stream(input, extractFields.create(), (err, actual) => {
      t.deepEqual(actual, expected, 'qs:gn_pop');
      t.end();
    });

  });

  test.test('zs:pop10 should be used for population when higher-ranked are unavailable/negative', (t) => {
    var input = [
      {
        id: 12345,
        properties: {
          'wof:name': 'wof:name value',
          'wof:placetype': 'country',
          'qs:gn_pop': -1,
          'zs:pop10': 17,
          'meso:pop': 18,
          'statoids:population': 19,
          'ne:pop_est': 20
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
        population: 17,
        popularity: undefined,
        bounding_box: undefined,
        abbreviation: undefined,
        hierarchies: []
      }
    ];

    test_stream(input, extractFields.create(), (err, actual) => {
      t.deepEqual(actual, expected, 'zs:pop10');
      t.end();
    });

  });

  test.test('meso:pop should be used for population when higher-ranked are unavailable/negative', (t) => {
    var input = [
      {
        id: 12345,
        properties: {
          'wof:name': 'wof:name value',
          'wof:placetype': 'country',
          'zs:pop10': -1,
          'meso:pop': 18,
          'statoids:population': 19,
          'ne:pop_est': 20
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
        population: 18,
        popularity: undefined,
        bounding_box: undefined,
        abbreviation: undefined,
        hierarchies: []
      }
    ];

    test_stream(input, extractFields.create(), (err, actual) => {
      t.deepEqual(actual, expected, 'meso:pop');
      t.end();
    });

  });

  test.test('statoids:population should be used for population when higher-ranked are unavailable/negative', (t) => {
    var input = [
      {
        id: 12345,
        properties: {
          'wof:name': 'wof:name value',
          'wof:placetype': 'country',
          'meso:pop': -1,
          'statoids:population': 19,
          'ne:pop_est': 20
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
        population: 19,
        popularity: undefined,
        bounding_box: undefined,
        abbreviation: undefined,
        hierarchies: []
      }
    ];

    test_stream(input, extractFields.create(), (err, actual) => {
      t.deepEqual(actual, expected, 'statoids:population');
      t.end();
    });

  });

  test.test('ne:pop_est should be used for population when higher-ranked are unavailable/negative', (t) => {
    var input = [
      {
        id: 12345,
        properties: {
          'wof:name': 'wof:name value',
          'wof:placetype': 'country',
          'statoids:population': -1,
          'ne:pop_est': 20
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
        population: 20,
        popularity: undefined,
        bounding_box: undefined,
        abbreviation: undefined,
        hierarchies: []
      }
    ];

    test_stream(input, extractFields.create(), (err, actual) => {
      t.deepEqual(actual, expected, 'ne:pop_est');
      t.end();
    });

  });

  test.test('population should be undefined when there are no non-negative population fields', (t) => {
    var input = [
      {
        id: 12345,
        properties: {
          'wof:name': 'wof:name value',
          'wof:placetype': 'country',
          'ne:pop_est': -1
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
        abbreviation: undefined,
        hierarchies: []
      }
    ];

    test_stream(input, extractFields.create(), (err, actual) => {
      t.deepEqual(actual, expected, 'population should be undefined');
      t.end();
    });

  });

});
