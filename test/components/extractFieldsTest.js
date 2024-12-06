var tape = require('tape');
const stream_mock = require('stream-mock');

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
  const reader = new stream_mock.ObjectReadableMock(input);
  const writer = new stream_mock.ObjectWritableMock();
  writer.on('error', (e) => callback(e));
  writer.on('finish', () => callback(null, writer.data));
  reader.pipe(testedStream).pipe(writer);
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
          'qs:photo_sum': 87654,
          ignoreField3: 'ignoreField3',
          ignoreField4: 'ignoreField4',
        }
      }
    ];

    var expected = [
      {
        id: 12345,
        name: 'name 1',
        name_aliases: [],
        name_langs: {},
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
        ],
        concordances: {}
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
        name_aliases: [],
        name_langs: {},
        place_type: undefined,
        lat: undefined,
        lon: undefined,
        population: undefined,
        popularity: undefined,
        abbreviation: undefined,
        bounding_box: undefined,
        hierarchies: [],
        concordances: {}
      }
    ];

    test_stream(input, extractFields.create(), function(err, actual) {
      t.deepEqual(actual, expected, 'stream should contain only objects with id and properties');
      t.end();
    });

  });

  test.test('empty wof:hierarchy should synthesize from wof:placetype and id', t => {
    const input = [
      {
        id: 12345,
        properties: {
          'wof:name': 'name 1',
          'wof:placetype': 'place type 1',
          'geom:latitude': 12.121212,
          'geom:longitude': 21.212121,
          'geom:bbox': '-13.691314,49.909613,1.771169,60.847886',
          'wof:hierarchy': []
        }
      }
    ];

    const expected = [
      {
        id: 12345,
        name: 'name 1',
        name_aliases: [],
        name_langs: {},
        place_type: 'place type 1',
        lat: 12.121212,
        lon: 21.212121,
        population: undefined,
        popularity: undefined,
        abbreviation: undefined,
        bounding_box: '-13.691314,49.909613,1.771169,60.847886',
        hierarchies: [
          {
            'place type 1_id': 12345
          }
        ],
        concordances: {}
      }
    ];

    test_stream(input, extractFields.create(), function(err, actual) {
      t.deepEqual(actual, expected, 'stream should contain only objects with id and properties');
      t.end();
    });

  });

  test.test('missing wof:hierarchy should synthesize from wof:placetype and id', t => {
    const input = [{
      id: 12345,
      properties: {
        'wof:name': 'name 1',
        'wof:placetype': 'place type 1',
        'geom:latitude': 12.121212,
        'geom:longitude': 21.212121,
        'geom:bbox': '-13.691314,49.909613,1.771169,60.847886',
      }
    }];
    const expected_hierarchies = [{
      'place type 1_id': 12345
    }];

    test_stream(input, extractFields.create(), function(err, output) {
      const record = output[0];
      t.deepEqual(record.hierarchies, expected_hierarchies, 'id is set');
      t.end();
    });

  });

  test.test('qs:photo_sum not found should not include popularity', function(t) {
    var input = [
      {
        id: 12345,
        properties: {
          'wof:name': 'name 1',
          'wof:placetype': 'place type 1',
          'geom:latitude': 12.121212,
          'geom:longitude': 21.212121
        }
      }
    ];

    test_stream(input, extractFields.create(), function(err, actual) {
      t.deepEqual(actual[0].popularity, undefined, 'popularity should not be set');
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
          'wof:country': 'US',
          'qs:a2_alt': 'qs:a2_alt value'
        }
      }
    ];

    test_stream(input, extractFields.create(), function(err, actual) {
      t.deepEqual(actual[0].name, 'qs:a2_alt value', 'qs:a2_alt should be used for name');
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

    test_stream(input, extractFields.create(), function(err, actual) {
      t.deepEqual(actual[0].name, 'wof:name value', 'wof:name should be used for name');
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

    test_stream(input, extractFields.create(), function(err, actual) {
      t.deepEqual(actual[0].name, 'wof:name value', 'wof:name should be used for name');
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

    test_stream(input, extractFields.create(), function(err, actual) {
      t.deepEqual(actual[0].lat, 14.141414, 'label geometry is used');
      t.deepEqual(actual[0].lon, 23.232323, 'label geometry is used');
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

    const expected_bounding_box = '-14.691314,50.909613,2.771169,61.847886';

    test_stream(input, extractFields.create(), function(err, actual) {
      t.deepEqual(actual[0].bounding_box, expected_bounding_box, 'label geometry is used');
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

    test_stream(input, extractFields.create(), function(err, actual) {
      t.deepEqual(actual[0].bounding_box, '', 'label geometry is used');
      t.end();
    });
  });

  test.test('label:{lang}_x_preferred_longname should be used for name when both it and eng label are available', function (t) {
    var input = [
      {
        id: 12345,
        properties: {
          'wof:name': 'wof:name value',
          'wof:label': 'wof:label value',
          'label:eng_x_preferred_longname': ['label:eng_x_preferred_longname value'],
          'label:spa_x_preferred_longname': ['label:spa_x_preferred_longname value'],
          'wof:lang_x_official': ['spa'],
          'geom:latitude': 12.121212,
          'geom:longitude': 21.212121,
          'lbl:bbox': ''
        }
      }
    ];

    const expected_name = 'label:spa_x_preferred_longname value';
    const expected_name_aliases = [
      'label:spa_x_preferred_longname value',
      'label:eng_x_preferred_longname value'
    ];

    test_stream(input, extractFields.create(), function (err, actual) {
      t.deepEqual(actual[0].name, expected_name, 'label:eng_x_preferred_longname is used for name');
      t.deepEqual(actual[0].name_aliases, expected_name_aliases, 'all longnames used as name aliases');
      t.end();
    });

  });

  test.test('label:eng_x_preferred_longname should be used for name when official language label unavailable', function (t) {
    var input = [
      {
        id: 12345,
        properties: {
          'wof:name': 'wof:name value',
          'wof:label': 'wof:label value',
          'label:eng_x_preferred_longname': ['label:eng_x_preferred_longname value'],
          'wof:lang_x_official': ['spa'],
          'geom:latitude': 12.121212,
          'geom:longitude': 21.212121,
          'lbl:bbox': ''
        }
      }
    ];

    test_stream(input, extractFields.create(), function (err, actual) {
      t.deepEqual(actual[0].name, 'label:eng_x_preferred_longname value', 'label:eng_x_preferred_longname is used for name');
      t.end();
    });

  });

  test.test('label:eng_x_preferred_longname when eng_x_preferred exists', function (t) {
    var input = [
      {
        id: 12345,
        properties: {
          'wof:name': 'wof:name value',
          'wof:label': 'wof:label value',
          'label:eng_x_preferred_longname': ['label:eng_x_preferred_longname value'],
          'label:eng_x_preferred': ['label:eng_x_preferred value'],
          'geom:latitude': 12.121212,
          'geom:longitude': 21.212121,
          'lbl:bbox': ''
        }
      }
    ];

    const expected_name = 'label:eng_x_preferred_longname value';
    const expected_name_aliases = [
      'label:eng_x_preferred_longname value',
      'label:eng_x_preferred value'
    ];

    test_stream(input, extractFields.create(), function (err, actual) {
      t.deepEqual(actual[0].name, expected_name, 'label:eng_x_preferred_longname is used for name');
      t.deepEqual(actual[0].name_aliases, expected_name_aliases, 'label:eng_x_* values used for name aliases');
      t.end();
    });

  });

  test.test('label:eng_x_preferred should be used for name when both it and wof:label are available', function (t) {
    var input = [
      {
        id: 12345,
        properties: {
          'wof:name': 'wof:name value',
          'wof:label': 'wof:label value',
          'label:eng_x_preferred': ['label:eng_x_preferred value'],
          'geom:latitude': 12.121212,
          'geom:longitude': 21.212121,
          'lbl:bbox': ''
        }
      }
    ];

    test_stream(input, extractFields.create(), function (err, actual) {
      t.deepEqual(actual[0].name, 'label:eng_x_preferred value', 'label:eng_x_preferred is used for name');
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

    test_stream(input, extractFields.create(), function(err, actual) {
      t.deepEqual(actual[0].name, 'wof:label value', 'wof:label is used for name');
      t.end();
    });

  });

  test.test('wof:placetype=locality (general abbreviation case) should use wof:shortcode over wof:abbreviation', function(t) {
    var input = [
      {
        id: 12345,
        properties: {
          'wof:name': 'wof:name value',
          'wof:placetype': 'locality',
          'wof:abbreviation': 'wof:abbreviation value',
          'wof:shortcode': 'wof:shortcode value'
        }
      }
    ];

    test_stream(input, extractFields.create(), function(err, actual) {
      t.deepEqual(actual[0].abbreviation, 'wof:shortcode value', 'wof:shortcode is used for abbreviation');
      t.end();
    });
  });

  test.test('wof:placetype=locality (general abbreviation case) should use wof:abbreviation if wof:shortcode not present', function(t) {
    var input = [
      {
        id: 12345,
        properties: {
          'wof:name': 'wof:name value',
          'wof:placetype': 'locality',
          'wof:abbreviation': 'wof:abbreviation value'
        }
      }
    ];

    test_stream(input, extractFields.create(), function(err, actual) {
      t.deepEqual(actual[0].abbreviation, 'wof:abbreviation value', 'wof:shortcode is used for abbreviation');
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
          'wof:country': 'wof:country value',
          'wof:abbreviation': 'wof:abbreviation value'
        }
      }
    ];

    var expected = [
      {
        id: 12345,
        name: 'wof:name value',
        name_aliases: [],
        name_langs: {},
        place_type: 'country',
        lat: undefined,
        lon: undefined,
        population: undefined,
        popularity: undefined,
        bounding_box: undefined,
        abbreviation: 'XY',
        hierarchies: [
          {
            'country_id': 12345
          }
        ]
      }
    ];

    test_stream(input, extractFields.create(), function(err, actual) {
      t.deepEqual(actual[0].abbreviation, 'wof:country value', 'wof:country is used for abbreviation');
      t.end();
    });

  });

  test.test('wof:placetype=dependency should use wof:shortcode value for abbreviation if present', function(t) {
    var input = [
      {
        id: 12345,
        properties: {
          'wof:name': 'wof:name value',
          'wof:placetype': 'dependency',
          'wof:country': 'value from wof:country',
          'wof:abbreviation': 'value from wof:abbreviation',
          'wof:shortcode': 'value from wof:shortcode'
        }
      }
    ];

    test_stream(input, extractFields.create(), function(err, actual) {
      t.deepEqual(actual[0].abbreviation, 'value from wof:shortcode', 'wof:shortcode is used for abbreviation');
      t.end();
    });
  });

  test.test('wof:placetype=dependency should use wof:abbreviation value for abbreviation if wof:shortcode not present', function(t) {
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

    test_stream(input, extractFields.create(), function(err, actual) {
      t.deepEqual(actual[0].abbreviation, 'value from wof:abbreviation', 'wof:abbreviation is used for abbreviation');
      t.end();
    });
  });

  test.test('wof:placetype=dependency should use wof:country for abbreviation if wof:shortcode/wof:abbreviation not present', function(t) {
    var input = [
      {
        id: 12345,
        properties: {
          'wof:name': 'wof:name value',
          'wof:placetype': 'dependency',
          'wof:country': 'value from wof:country',
        }
      }
    ];

    test_stream(input, extractFields.create(), function(err, actual) {
      t.deepEqual(actual[0].abbreviation, 'value from wof:country', 'wof:country is used for abbreviation');
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
          'wof:abbreviation': 'value from wof:abbreviation'
        }
      }
    ];

    test_stream(input, extractFields.create(), function(err, actual) {
      t.deepEqual(actual[0].abbreviation, 'value from wof:abbreviation', 'wof:abbreviation is used for abbreviation');
      t.end();
    });

  });
  test.end();
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

    test_stream(input, extractFields.create(), (err, actual) => {
      t.deepEqual(actual[0].population, 10, 'mz:population used');
      t.end();
    });
  });

  test.test('wof:population should be used for population when higher-ranked aren\'t available', (t) => {
    var input = [{
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
    }];

    test_stream(input, extractFields.create(), (err, actual) => {
      t.deepEqual(actual[0].population, 11, 'wof:population used');
      t.end();
    });
  });

  test.test('wk:population should be used for population when higher-ranked aren\'t available', (t) => {
    var input = [{
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
    }];

    test_stream(input, extractFields.create(), (err, actual) => {
      t.deepEqual(actual[0].population, 12, 'wk:population used');
      t.end();
    });
  });

  test.test('gn:population should be used for population when higher-ranked aren\'t available', (t) => {
    var input = [{
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
    }];

    test_stream(input, extractFields.create(), (err, actual) => {
      t.deepEqual(actual[0].population, 13, 'gn:population used');
      t.end();
    });
  });

  test.test('gn:pop should be used for population when higher-ranked aren\'t available', (t) => {
    var input = [{
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
    }];

    test_stream(input, extractFields.create(), (err, actual) => {
      t.deepEqual(actual[0].population, 14, 'gn:pop used');
      t.end();
    });
  });

  test.test('qs:pop should be used for population when higher-ranked aren\'t available', (t) => {
    var input = [{
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
    }];

    test_stream(input, extractFields.create(), (err, actual) => {
      t.deepEqual(actual[0].population, 15, 'qs:pop used');
      t.end();
    });
  });

  test.test('qs:gn_pop should be used for population when higher-ranked aren\'t available', (t) => {
    var input = [{
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
    }];

    test_stream(input, extractFields.create(), (err, actual) => {
      t.deepEqual(actual[0].population, 16, 'qs:gn_pop used');
      t.end();
    });
  });

  test.test('zs:pop10 should be used for population when higher-ranked aren\'t available', (t) => {
    var input = [{
      id: 12345,
      properties: {
        'wof:name': 'wof:name value',
        'wof:placetype': 'country',
        'zs:pop10': 17,
        'meso:pop': 18,
        'statoids:population': 19,
        'ne:pop_est': 20
      }
    }];

    test_stream(input, extractFields.create(), (err, actual) => {
      t.deepEqual(actual[0].population, 17, 'zs:pop10 used');
      t.end();
    });
  });

  test.test('meso:pop should be used for population when higher-ranked aren\'t available', (t) => {
    var input = [{
      id: 12345,
      properties: {
        'wof:name': 'wof:name value',
        'wof:placetype': 'country',
        'meso:pop': 18,
        'statoids:population': 19,
        'ne:pop_est': 20
      }
    }];

    test_stream(input, extractFields.create(), (err, actual) => {
      t.deepEqual(actual[0].population, 18, 'meso:pop used');
      t.end();
    });
  });

  test.test('statoids:population should be used for population when higher-ranked aren\'t available', (t) => {
    var input = [{
      id: 12345,
      properties: {
        'wof:name': 'wof:name value',
        'wof:placetype': 'country',
        'statoids:population': 19,
        'ne:pop_est': 20
      }
    }];

    test_stream(input, extractFields.create(), (err, actual) => {
      t.deepEqual(actual[0].population, 19, 'statoids:population used');
      t.end();
    });
  });

  test.test('ne:pop_est should be used for population when higher-ranked aren\'t available', (t) => {
    var input = [{
      id: 12345,
      properties: {
        'wof:name': 'wof:name value',
        'wof:placetype': 'country',
        'ne:pop_est': 20
      }
    }];

    test_stream(input, extractFields.create(), (err, actual) => {
      t.deepEqual(actual[0].population, 20, 'ne:pop_est used');
      t.end();
    });

  });

  test.test('population should be undefined when no recognized population fields are available', (t) => {
    var input = [{
      id: 12345,
      properties: {
        'wof:name': 'wof:name value',
        'wof:placetype': 'country'
      }
    }];

    test_stream(input, extractFields.create(), (err, actual) => {
      t.deepEqual(actual[0].population, undefined, 'population should be undefined');
      t.end();
    });

  });

  test.test('string population fields should be converted to integer', (t) => {
    var input = [{
      id: 12345,
      properties: {
        'wof:name': 'wof:name value',
        'wof:placetype': 'country',
        'mz:population': '10'
      }
    }];

    test_stream(input, extractFields.create(), (err, actual) => {
      t.deepEqual(actual[0].population, 10, 'string population value converted to integer');
      t.end();
    });
  });

  test.test('unparseable-as-integer population fields should be skipped', (t) => {
    var input = [{
      id: 12345,
      properties: {
        'wof:name': 'wof:name value',
        'wof:placetype': 'country',
        'mz:population': 'this cannot be parsed an integer',
        'wof:population': 11
      }
    }];

    test_stream(input, extractFields.create(), (err, actual) => {
      t.deepEqual(actual[0].population, 11, 'first integer parseable population used');
      t.end();
    });
  });
  test.end();
});

tape('negative population fallback tests', (test) => {
  test.test('wof:population should be used for population when higher-ranked are unavailable/negative', (t) => {
    var input = [{
      id: 12345,
      properties: {
        'wof:name': 'wof:name value',
        'wof:placetype': 'country',
        'mz:population': -1,
        'wof:population': 11
      }
    }];

    test_stream(input, extractFields.create(), (err, actual) => {
      t.deepEqual(actual[0].population, 11, 'wof:population used over negative mz:population value');
      t.end();
    });
  });

  test.test('population should be undefined when there are no non-negative population fields', (t) => {
    var input = [{
      id: 12345,
      properties: {
        'wof:name': 'wof:name value',
        'wof:placetype': 'country',
        'ne:pop_est': -1
      }
    }];

    test_stream(input, extractFields.create(), (err, actual) => {
      t.deepEqual(actual[0].population, undefined, 'population should be undefined');
      t.end();
    });
  });
});

tape('name alias tests', (test) => {
  test.test('name:preferred and name:variant fields used to populate name_aliases, using english as default language', function (t) {
    var input = [{
      id: 23456,
      properties: {
        'name:eng_x_preferred': ['preferred1', 'preferred2', 'preferred1'],
        'name:eng_x_variant': ['variant1', 'variant2', 'variant1'],
        'name:eng_x_colloquial': ['colloquial1', 'colloquial2', 'colloquial1'],
        'label:eng_x_preferred_longname': ['englabel1', 'englabel2', 'englabel1'],
        'label:spa_x_preferred_longname': ['spalabel1', 'spalabel2', 'spalabel1'],
        'label:fra_x_preferred_longname': ['fralabel1', 'fralabel2', 'fralabel1']
      }
    }];

    const expected_name_aliases = ['preferred1', 'preferred2', 'englabel1', 'englabel2'];

    test_stream(input, extractFields.create(), function (err, actual) {
      t.deepEqual(actual[0].name_aliases, expected_name_aliases, 'name aliases populated from preferred and variant fields');
      t.end();
    });
  });

  test.test('name aliases populated from official language (plus english) preferred and variant fields', function (t) {
    var input = [
      {
        id: 23456,
        properties: {
          'name:spa_x_preferred': ['preferred1', 'preferred2', 'preferred1'],
          'name:spa_x_variant': ['variant1', 'variant2', 'variant1'],
          'name:spa_x_colloquial': ['colloquial1', 'colloquial2', 'colloquial1'],
          'label:eng_x_preferred_longname': ['englabel1', 'englabel2', 'englabel1'],
          'label:spa_x_preferred_longname': ['spalabel1', 'spalabel2', 'spalabel1'],
          'label:fra_x_preferred_longname': ['fralabel1', 'fralabel2', 'fralabel1'],
          'wof:lang_x_official': ['spa','fra']
        }
      }
    ];

    const expected_name_aliases = [
      'preferred1', 'preferred2',
      'spalabel1', 'spalabel2',
      'fralabel1', 'fralabel2',
      'englabel1', 'englabel2'
    ];

    test_stream(input, extractFields.create(), function (err, actual) {
      t.deepEqual(actual[0].name_aliases, expected_name_aliases, 'name aliases sourced from official languages and english');
      t.end();
    });
  });

  test.end();
});

tape('multi-lang index test', (test) => {
  test.test('all elements in default language should not be in other indexes', function (t) {
    var input = [{
      id: 54321,
      properties: {
        'wof:name': ['default1', 'default2'],
        'name:eng_x_preferred': ['preferredENG1'],
        'name:fra_x_preferred': ['default1', 'preferredFRA1', 'preferredFRA2'],
        'name:spa_x_variant': ['default2', 'variantSPA1', 'variantSPA2'],
      }
    }];

    const expected_name_langs = {
      'en': ['preferredENG1'],
      'fr': ['preferredFRA1', 'preferredFRA2']
    };

    test_stream(input, extractFields.create(), function (err, actual) {
      t.deepEqual(actual[0].name_langs, expected_name_langs, 'name langs populated from fr preferred fields');
      t.end();
    });
  });

  test.test('name langs should be without duplicates', function (t) {
    var input = [
      {
        id: 54321,
        properties: {
          'name:fra_x_preferred': ['preferredFRA1', 'preferredFRA2', 'preferredFRA2'],
          'name:spa_x_preferred': ['variantSPA1', 'variantSPA1', 'variantSPA2'],
          'wof:name': ['prefered1']
        }
      }
    ];

    const expected_name_langs = {
      'fr': ['preferredFRA1', 'preferredFRA2'],
      'es': ['variantSPA1', 'variantSPA2']
    };

    test_stream(input, extractFields.create(), function (err, actual) {
      t.deepEqual(actual[0].name_langs, expected_name_langs, 'should not have duplicates');
      t.end();
    });
  });

  test.test('name langs should concat iso639-2B and iso639-2T', function (t) {
    var input = [
      {
        id: 54321,
        properties: {
          'name:fra_x_preferred': ['preferredFRA1', 'preferredFRA2'],
          'name:fre_x_preferred': ['preferredFRE1'],
          'wof:name': ['prefered1']
        }
      }
    ];

    const expected_name_langs = {
      'fr': ['preferredFRA1', 'preferredFRA2', 'preferredFRE1']
    };

    test_stream(input, extractFields.create(), function (err, actual) {
      t.deepEqual(actual[0].name_langs, expected_name_langs, 'should not have duplicates');
      t.end();
    });
  });

  test.test('WOF_NAMES_REGEX should be anchored (do not allow prefixes and suffixes)', function (t) {
    var input = [
      {
        id: 54321,
        properties: {
          'name:fra_x_preferred': ['example1'],
          'name:fra_x_preferred_foo': ['example2'],
          'foo_name:fra_x_preferred': ['example3'],
          'label:fra_x_preferred': ['example4'],
          'label:fra_x_preferred_foo': ['example5'],
          'foo_label:fra_x_preferred': ['example6']
        }
      }
    ];

    const expected_name_langs = {
      'fr': ['example1', 'example4']
    };

    test_stream(input, extractFields.create(), function (err, actual) {
      t.deepEqual(actual[0].name_langs, expected_name_langs, 'should not have duplicates');
      t.end();
    });
  });

  test.end();
});

tape('concordances', (test) => {
  test.test('missing concordances', function (t) {
    var input = [{
      id: 54321,
      properties: {}
    }];

    test_stream(input, extractFields.create(), function (err, actual) {
      t.deepEqual(actual[0].concordances, {}, 'no-op');
      t.end();
    });
  });

  test.test('empty concordances', function (t) {
    var input = [{
      id: 54321,
      properties: {
        'wof:concordances': {}
      }
    }];

    test_stream(input, extractFields.create(), function (err, actual) {
      t.deepEqual(actual[0].concordances, {}, 'no-op');
      t.end();
    });
  });

  test.test('wrong type concordances', function (t) {
    var input = [{
      id: 54321,
      properties: {
        'wof:concordances': 'string'
      }
    }];

    test_stream(input, extractFields.create(), function (err, actual) {
      t.deepEqual(actual[0].concordances, {}, 'no-op');
      t.end();
    });
  });

  test.test('map valid concordances', function (t) {
    var input = [{
      id: 54321,
      properties: {
        'wof:concordances': {
          'alpha': 'bar',
          'beta': 2,
          'gamma': null,
          'delta': undefined,
          'epsilon': [{ 'foo': 'bar' }],
          'zeta': [ 'foo', 'bar' ],
          'eta': 2.2,
          'theta': 0
        }
      }
    }];

    test_stream(input, extractFields.create(), function (err, actual) {
      t.deepEqual(actual[0].concordances, { alpha: 'bar', beta: 2 }, 'mapped valid values');
      t.end();
    });
  });

  test.test('trim concordances', function (t) {
    var input = [{
      id: 54321,
      properties: {
        'wof:concordances': {
          ' alpha ': ' bar '
        }
      }
    }];

    test_stream(input, extractFields.create(), function (err, actual) {
      t.deepEqual(actual[0].concordances, { alpha: 'bar' }, 'trim keys/values');
      t.end();
    });
  });

  test.test('qs_pg prefixed concordances', function (t) {
    var input = [{
      id: 54321,
      properties: {
        'qs_pg:gn_id': ' bar ',
        'qs_pg:qs_id': 100,
        'qs_pg:qs_nn': ' bat '
      }
    }];

    test_stream(input, extractFields.create(), function (err, actual) {
      t.deepEqual(actual[0].concordances, { 'gn:id': 'bar', 'qs:id': 100 }, 'map qs_pg props');
      t.end();
    });
  });

  test.test('qs_pg prefer wof:concordances', function (t) {
    var input = [{
      id: 54321,
      properties: {
        'qs_pg:qs_id': 100,
        'wof:concordances': {
          'qs:id': 200
        }
      }
    }];

    test_stream(input, extractFields.create(), function (err, actual) {
      t.deepEqual(actual[0].concordances, { 'qs:id': 200 }, 'prefer wof:concordances');
      t.end();
    });
  });

  test.end();
});
