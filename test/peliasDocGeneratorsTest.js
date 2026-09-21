var tape = require('tape');
var Document = require('pelias-model').Document;
var peliasDocGenerators = require('../src/peliasDocGenerators');
const stream_mock = require('stream-mock');

function test_stream(input, testedStream, callback) {
  const reader = new stream_mock.ObjectReadableMock(input);
  const writer = new stream_mock.ObjectWritableMock();
  writer.on('error', (e) => callback(e));
  writer.on('finish', () => callback(null, writer.data));
  reader.pipe(testedStream).pipe(writer);
}

tape('create', function(test) {
  const place_types = ['neighbourhood', 'locality', 'borough', 'localadmin',
    'county', 'macrocounty', 'region', 'macroregion',
    'dependency', 'postalcode', 'ocean', 'marinearea',
    'continent', 'empire'];

  place_types.forEach(function(place_type) {
    test.test(`non-country place_type (${place_type}) should be returned as Document with that place_type`, function(t) {
      var wofRecords = {
        1: {
          id: 1,
          name: 'record name',
          name_aliases: [],
          lat: 12.121212,
          lon: 21.212121,
          place_type: place_type
        }
      };

      // extract all the values from wofRecords to an array since that's how test_stream works
      // sure, this could be done with map, but this is clearer
      var input = [
        wofRecords['1']
      ];

      var expected = [
        new Document( 'whosonfirst', place_type, '1')
          .setName('default', 'record name')
          .setCentroid({ lat: 12.121212, lon: 21.212121 })
          .addParent( place_type, 'record name', '1')
      ];

      // index a version of postcode which doesn't contain whitespace
      if (place_type === 'postalcode'){
        expected[0].setNameAlias('default', 'recordname')
                   .clearParent(place_type)
                   .addParent(place_type, 'record name', '1', 'recordname');
      }

      var hierarchies_finder = function() {
        return [
          [
            wofRecords['1']
          ]
        ];
      };

      var docGenerator = peliasDocGenerators.create(hierarchies_finder);

      test_stream(input, docGenerator, function(err, actual) {
        t.deepEqual(actual, expected, 'should have returned true');
        t.end();
      });
    });
  });

  test.test('region should honor abbreviations when available', function(t) {
    var wofRecords = {
      1: {
        id: 1,
        name: 'record name',
        name_aliases: [],
        abbreviation: 'record abbreviation',
        lat: 12.121212,
        lon: 21.212121,
        place_type: 'region'
      }
    };

    // extract all the values from wofRecords to an array since that's how test_stream works
    // sure, this could be done with map, but this is clearer
    var input = [
      wofRecords['1']
    ];

    var expected = [
      new Document( 'whosonfirst', 'region', '1')
        .setName('default', 'record name')
        .setCentroid({ lat: 12.121212, lon: 21.212121 })
        .addParent( 'region', 'record name', '1', 'record abbreviation')
    ];

    var hierarchies_finder = function() {
      return [
        [
          wofRecords['1']
        ]
      ];
    };

    var docGenerator = peliasDocGenerators.create(hierarchies_finder);

    test_stream(input, docGenerator, function(err, actual) {
      t.deepEqual(actual, expected, 'should have returned true');
      t.end();
    });


  });

  test.test('dependency with unknown abbreviation should not set', function(t) {
    var wofRecords = {
      1: {
        id: 1,
        name: 'record name',
        name_aliases: [],
        abbreviation: 'XY',
        lat: 12.121212,
        lon: 21.212121,
        place_type: 'dependency'
      }
    };

    // extract all the values from wofRecords to an array since that's how test_stream works
    // sure, this could be done with map, but this is clearer
    var input = [
      wofRecords['1']
    ];

    var expected = [
      new Document( 'whosonfirst', 'dependency', '1')
        .setName('default', 'record name')
        .setCentroid({ lat: 12.121212, lon: 21.212121 })
        .addParent( 'dependency', 'record name', '1')
    ];

    var hierarchies_finder = function() {
      return [
        [
          wofRecords['1']
        ]
      ];
    };

    var docGenerator = peliasDocGenerators.create(hierarchies_finder);

    test_stream(input, docGenerator, function(err, actual) {
      t.deepEqual(actual, expected, 'should have returned true');
      t.end();
    });
  });

  test.test('dependency with abbreviation known as iso3 should use iso3 as abbreviation', function(t) {
    var wofRecords = {
      1: {
        id: 1,
        name: 'record name',
        name_aliases: [],
        abbreviation: 'PR',
        lat: 12.121212,
        lon: 21.212121,
        place_type: 'dependency'
      }
    };

    // extract all the values from wofRecords to an array since that's how test_stream works
    // sure, this could be done with map, but this is clearer
    var input = [
      wofRecords['1']
    ];

    var expected = [
      new Document( 'whosonfirst', 'dependency', '1')
        .setName('default', 'record name')
        .setCentroid({ lat: 12.121212, lon: 21.212121 })
        .addParent( 'dependency', 'record name', '1', 'PRI')
    ];

    var hierarchies_finder = function() {
      return [
        [
          wofRecords['1']
        ]
      ];
    };

    var docGenerator = peliasDocGenerators.create(hierarchies_finder);

    test_stream(input, docGenerator, function(err, actual) {
      t.deepEqual(actual, expected, 'should have returned true');
      t.end();
    });
  });

  test.test('country with abbreviation known as iso3 should use iso3 as abbreviation', function(t) {
    var wofRecords = {
      1: {
        id: 1,
        name: 'record name',
        name_aliases: [],
        abbreviation: 'FR',
        lat: 12.121212,
        lon: 21.212121,
        place_type: 'country'
      }
    };

    // extract all the values from wofRecords to an array since that's how test_stream works
    // sure, this could be done with map, but this is clearer
    var input = [
      wofRecords['1']
    ];

    var expected = [
      new Document( 'whosonfirst', 'country', '1')
        .setName('default', 'record name')
        .setCentroid({ lat: 12.121212, lon: 21.212121 })
        .addParent( 'country', 'record name', '1', 'FRA')
    ];

    var hierarchies_finder = function() {
      return [
        [
          wofRecords['1']
        ]
      ];
    };

    var docGenerator = peliasDocGenerators.create(hierarchies_finder);

    test_stream(input, docGenerator, function(err, actual) {
      t.deepEqual(actual, expected, 'should have returned true');
      t.end();
    });


  });

  test.test('wofRecord with bounding_box should have bounding box in Document', function(t) {
    var wofRecords = {
      1: {
        id: 1,
        name: 'name 1',
        name_aliases: [],
        lat: 12.121212,
        lon: 21.212121,
        bounding_box: '12.121212,21.212121,13.131313,31.313131',
        place_type: 'continent'
      }
    };

    var input = [
      wofRecords['1']
    ];

    var expected = [
      new Document( 'whosonfirst', 'continent', '1' )
          .setName('default', 'name 1')
          .setCentroid({ lat: 12.121212, lon: 21.212121 })
          .setBoundingBox({ upperLeft: { lat:31.313131, lon:12.121212 }, lowerRight: { lat:21.212121 , lon:13.131313 }})
    ];

    // don't care about hierarchies in this test
    var hierarchies_finder = function() {
      return [];
    };

    var docGenerator = peliasDocGenerators.create(hierarchies_finder);

    test_stream(input, docGenerator, function(err, actual) {
      t.deepEqual(actual, expected, 'should have returned true');
      t.end();
    });

  });

  test.test('wofRecord without bounding_box should have undefined bounding box in output', function(t) {
    var wofRecords = {
      1: {
        id: 1,
        name: 'name 1',
        name_aliases: [],
        lat: 12.121212,
        lon: 21.212121,
        place_type: 'continent'
      }
    };

    var input = [
      wofRecords['1']
    ];

    var expected = [
      new Document( 'whosonfirst', 'continent', '1' )
          .setName('default', 'name 1')
          .setCentroid({ lat: 12.121212, lon: 21.212121 })
    ];

    // don't care about hierarchies in this test
    var hierarchies_finder = function() {
      return [];
    };

    var docGenerator = peliasDocGenerators.create(hierarchies_finder);

    test_stream(input, docGenerator, function(err, actual) {
      t.deepEqual(actual, expected, 'should have returned true');
      t.end();
    });

  });

  test.test('wofRecord with geometry should have shape in Document', function(t) {
    var wofRecords = {
      1: {
        id: 1,
        name: 'name 1',
        name_aliases: [],
        lat: 12.121212,
        lon: 21.212121,
        bounding_box: '12.121212,21.212121,13.131313,31.313131',
        geometry: {'coordinates':[[[-72.122,42.428],[-72.122,42.409],[-72.091,42.409],[-72.091,42.428],[-72.122,42.428]]],'type':'Polygon'},
        place_type: 'continent'
      }
    };

    var input = [
      wofRecords['1']
    ];

    var expected = [
      new Document( 'whosonfirst', 'continent', '1' )
          .setName('default', 'name 1')
          .setCentroid({ lat: 12.121212, lon: 21.212121 })
          .setBoundingBox({ upperLeft: { lat:31.313131, lon:12.121212 }, lowerRight: { lat:21.212121 , lon:13.131313 }})
          .setShape({coordinates:[[[-72.122,42.428],[-72.122,42.409],[-72.091,42.409],[-72.091,42.428],[-72.122,42.428]]],type:"Polygon"})
    ];

    // don't care about hierarchies in this test
    var hierarchies_finder = function() {
      return [];
    };

    var docGenerator = peliasDocGenerators.create(hierarchies_finder);

    test_stream(input, docGenerator, function(err, actual) {
      t.deepEqual(actual, expected, 'should have returned true');
      t.end();
    });

  });

  test.test('wofRecord without geometry should have undefined shape in output', function(t) {
    var wofRecords = {
      1: {
        id: 1,
        name: 'name 1',
        name_aliases: [],
        lat: 12.121212,
        lon: 21.212121,
        place_type: 'continent'
      }
    };

    var input = [
      wofRecords['1']
    ];

    var expected = [
      new Document( 'whosonfirst', 'continent', '1' )
          .setName('default', 'name 1')
          .setCentroid({ lat: 12.121212, lon: 21.212121 })
    ];

    // don't care about hierarchies in this test
    var hierarchies_finder = function() {
      return [];
    };

    var docGenerator = peliasDocGenerators.create(hierarchies_finder);

    test_stream(input, docGenerator, function(err, actual) {
      t.deepEqual(actual, expected, 'should have returned true');
      t.end();
    });

  });

  test.test('wofRecord without name should have undefined name in output', function(t) {
    var wofRecords = {
      1: {
        id: 1,
        lat: 12.121212,
        lon: 21.212121,
        place_type: 'continent',
        bounding_box: '-13.691314,49.909613,1.771169,60.847886',
        hierarchy: undefined
      }
    };

    var input = [
      wofRecords['1']
    ];

    var expected = [
      new Document( 'whosonfirst', 'continent', '1' )
        .setCentroid({ lat: 12.121212, lon: 21.212121 })
        .setBoundingBox({ upperLeft: { lat:60.847886, lon:-13.691314 }, lowerRight: { lat:49.909613 , lon:1.771169 }}),
    ];

    // don't care about hierarchies in this test
    var hierarchies_finder = function() {
      return [];
    };

    var docGenerator = peliasDocGenerators.create(hierarchies_finder);

    test_stream(input, docGenerator, function(err, actual) {
      t.deepEqual(actual, expected, 'should have returned true');
      t.end();
    });

  });

  test.test('undefined population should not set population in doc', function(t) {
    var wofRecords = {
      1: {
        id: 1,
        name: 'United States',
        name_aliases: [],
        lat: 12.121212,
        lon: 21.212121,
        place_type: 'country',
        abbreviation: 'US',
        population: undefined
      }
    };

    // extract all the values from wofRecords to an array since that's how test_stream works
    // sure, this could be done with map, but this is clearer
    var input = [
      wofRecords['1']
    ];

    var expected = [
      new Document( 'whosonfirst', 'country', '1')
        .setName('default', 'United States')
        .setCentroid({ lat: 12.121212, lon: 21.212121 })
        .addParent('country', 'United States', '1', 'USA')
    ];

    var hierarchies_finder = function() {
      return [
        [
          wofRecords['1']
        ]
      ];
    };

    var docGenerator = peliasDocGenerators.create(hierarchies_finder);

    test_stream(input, docGenerator, function(err, actual) {
      t.deepEqual(actual, expected, 'population should not be set');
      t.end();
    });

  });

  test.test('defined population should set population in doc', function(t) {
    var wofRecords = {
      1: {
        id: 1,
        name: 'United States',
        name_aliases: [],
        lat: 12.121212,
        lon: 21.212121,
        place_type: 'country',
        abbreviation: 'US',
        population: 98765
      }
    };

    // extract all the values from wofRecords to an array since that's how test_stream works
    // sure, this could be done with map, but this is clearer
    var input = [
      wofRecords['1']
    ];

    var expected = [
      new Document( 'whosonfirst', 'country', '1')
        .setName('default', 'United States')
        .setCentroid({ lat: 12.121212, lon: 21.212121 })
        .addParent('country', 'United States', '1', 'USA')
        .setPopulation(98765)
    ];

    var hierarchies_finder = function() {
      return [
        [
          wofRecords['1']
        ]
      ];
    };

    var docGenerator = peliasDocGenerators.create(hierarchies_finder);

    test_stream(input, docGenerator, function(err, actual) {
      t.deepEqual(actual, expected, 'population should not be set');
      t.end();
    });

  });

  test.test('undefined population should not set population in doc', function(t) {
    var wofRecords = {
      1: {
        id: 1,
        name: 'United States',
        name_aliases: [],
        lat: 12.121212,
        lon: 21.212121,
        place_type: 'country',
        abbreviation: 'US',
        popularity: undefined
      }
    };

    // extract all the values from wofRecords to an array since that's how test_stream works
    // sure, this could be done with map, but this is clearer
    var input = [
      wofRecords['1']
    ];

    var expected = [
      new Document( 'whosonfirst', 'country', '1')
        .setName('default', 'United States')
        .setCentroid({ lat: 12.121212, lon: 21.212121 })
        .addParent('country', 'United States', '1', 'USA')
    ];

    var hierarchies_finder = function() {
      return [
        [
          wofRecords['1']
        ]
      ];
    };

    var docGenerator = peliasDocGenerators.create(hierarchies_finder);

    test_stream(input, docGenerator, function(err, actual) {
      t.deepEqual(actual, expected, 'population should not be set');
      t.end();
    });

  });

  test.test('defined population should set population in doc', function(t) {
    var wofRecords = {
      1: {
        id: 1,
        name: 'United States',
        name_aliases: [],
        lat: 12.121212,
        lon: 21.212121,
        place_type: 'country',
        abbreviation: 'US',
        popularity: 87654
      }
    };

    // extract all the values from wofRecords to an array since that's how test_stream works
    // sure, this could be done with map, but this is clearer
    var input = [
      wofRecords['1']
    ];

    var expected = [
      new Document( 'whosonfirst', 'country', '1')
        .setName('default', 'United States')
        .setCentroid({ lat: 12.121212, lon: 21.212121 })
        .addParent('country', 'United States', '1', 'USA')
        .setPopularity(87654)
    ];

    var hierarchies_finder = function() {
      return [
        [
          wofRecords['1']
        ]
      ];
    };

    var docGenerator = peliasDocGenerators.create(hierarchies_finder);

    test_stream(input, docGenerator, function(err, actual) {
      t.deepEqual(actual, expected, 'population should not be set');
      t.end();
    });

  });

  test.test('name aliases should be set on doc', function (t) {
    var wofRecords = {
      1: {
        id: 1,
        name: 'United States',
        name_aliases: [
          'preferred1', 'preferred2',
          'variant1', 'variant2'
        ],
        lat: 12.121212,
        lon: 21.212121,
        place_type: 'country',
        abbreviation: 'US',
        popularity: 87654
      }
    };

    // extract all the values from wofRecords to an array since that's how test_stream works
    // sure, this could be done with map, but this is clearer
    var input = [
      wofRecords['1']
    ];

    var expected = [
      new Document('whosonfirst', 'country', '1')
        .setName('default', 'United States')
        .setNameAlias('default', 'preferred1')
        .setNameAlias('default', 'preferred2')
        .setNameAlias('default', 'variant1')
        .setNameAlias('default', 'variant2')
        .setCentroid({ lat: 12.121212, lon: 21.212121 })
        .addParent('country', 'United States', '1', 'USA')
        .setPopularity(87654)
    ];

    var hierarchies_finder = function () {
      return [
        [
          wofRecords['1']
        ]
      ];
    };

    var docGenerator = peliasDocGenerators.create(hierarchies_finder);

    test_stream(input, docGenerator, function (err, actual) {
      t.deepEqual(actual, expected, 'population should not be set');
      t.end();
    });

  });

  test.test('a single document should be created when multiple hierarchies exist', function(t) {
    var wofRecords = {
      1: {
        id: 1,
        name: 'neighbourhood name',
        name_aliases: [],
        lat: 12.121212,
        lon: 21.212121,
        place_type: 'neighbourhood'
      },
      2: {
        id: 2,
        name: 'country name 1',
        name_aliases: [],
        lat: 13.131313,
        lon: 31.313131,
        place_type: 'country'
      },
      3: {
        id: 3,
        name: 'country name 2',
        name_aliases: [],
        lat: 14.141414,
        lon: 41.414141,
        place_type: 'country'
      }
    };

    // extract all the values from wofRecords to an array since that's how test_stream works
    // sure, this could be done with map, but this is clearer
    var input = [
      wofRecords['1']
    ];

    var expected = [
      new Document( 'whosonfirst', 'neighbourhood', '1')
        .setName('default', 'neighbourhood name')
        .setCentroid({ lat: 12.121212, lon: 21.212121 })
        .addParent( 'neighbourhood', 'neighbourhood name', '1')
        .addParent( 'country', 'country name 1', '2'),
    ];

    var hierarchies_finder = function() {
      return [
        [
          wofRecords['1'],
          wofRecords['2']
        ],
        [
          wofRecords['1'],
          wofRecords['3']
        ]
      ];
    };

    var docGenerator = peliasDocGenerators.create(hierarchies_finder);

    test_stream(input, docGenerator, function(err, actual) {
      t.deepEqual(actual, expected, 'should have returned true');
      t.end();
    });

  });

  test.test('errors: should catch model errors and continue', function (t) {

    // trigger model to throw an exception by providing an invalid name
    var input = [{
      id: 1,
      name: 'http://urls_not_allowed_here',
      place_type: 'country'
    }];

    t.doesNotThrow(() => {
      var docGenerator = peliasDocGenerators.create(() => {
        return [[input[0]]];
      });

      test_stream(input, docGenerator, function (err, actual) {
        t.deepEqual(actual, [], 'should throw error and continue');
        t.end();
      }, /should not match/, 'should catch + log model errors');
    });

  });

  test.test('name langs should be set on doc', function (t) {
    var wofRecords = {
      1: {
        id: 1,
        name: 'Japan',
        name_aliases: [],
        name_langs: {
          'jp': [
            'Nihon'
          ],
          'fr': [
            'Japon', 'Pays Du Soleil Levant'
          ]
        },
        lat: 12.121212,
        lon: 21.212121,
        place_type: 'country',
        abbreviation: 'JP',
        popularity: 25000
      }
    };

    var input = [
      wofRecords['1']
    ];

    var expected = [
      new Document('whosonfirst', 'country', '1')
        .setName('default', 'Japan')
        .setName('jp', 'Nihon')
        .setName('fr', 'Japon')
        .setNameAlias('fr', 'Pays Du Soleil Levant')
        .setCentroid({ lat: 12.121212, lon: 21.212121 })
        .addParent('country', 'Japan', '1', 'JPN')
        .setPopularity(25000)
    ];

    var hierarchies_finder = function () {
      return [
        [
          wofRecords['1']
        ]
      ];
    };

    var docGenerator = peliasDocGenerators.create(hierarchies_finder);

    test_stream(input, docGenerator, function (err, actual) {
      t.deepEqual(actual, expected, 'population should not be set');
      t.end();
    });

  });

  test.test('addendum.concordances empty by default', function (t) {
    const input = {
      id: 1,
      name: 'Example',
      name_aliases: [],
      lat: 12.121212,
      lon: 21.212121,
      place_type: 'country'
    };

    test_stream([input], peliasDocGenerators.create(() => [[input]]), function (err, actual) {
      t.false(err);
      t.false(
        actual[0].getAddendum('concordances'),
        'addendum.concordances not set'
      );
      t.end();
    });
  });

  test.test('addendum.concordances should be set where available', function (t) {
    const input = {
      id: 1,
      name: 'Example',
      name_aliases: [],
      lat: 12.121212,
      lon: 21.212121,
      place_type: 'country',
      concordances: {
        'alpha': 'alpha',
        'beta': 100
      }
    };

    test_stream([input], peliasDocGenerators.create(() => [[input]]), function (err, actual) {
      t.false(err);
      t.deepEqual(
        actual[0].getAddendum('concordances'),
        input.concordances,
        'addendum.concordances correctly set'
      );
      t.end();
    });
  });

  test.end();

});
