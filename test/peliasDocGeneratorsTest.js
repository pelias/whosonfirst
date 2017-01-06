var tape = require('tape');
var Document = require('pelias-model').Document;
var peliasDocGenerators = require('../src/peliasDocGenerators');
var event_stream = require('event-stream');

function test_stream(input, testedStream, callback) {
    var input_stream = event_stream.readArray(input);
    var destination_stream = event_stream.writeArray(callback);

    input_stream.pipe(testedStream).pipe(destination_stream);
}

tape('create', function(test) {
  test.test('non-country place_types should be returned as Document with that place_type', function(t) {
    var place_types = ['neighbourhood', 'locality', 'borough', 'localadmin',
                        'county', 'macrocounty', 'region', 'macroregion', 'dependency'];

    place_types.forEach(function(place_type) {
      var wofRecords = {
        1: {
          id: 1,
          name: 'record name',
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
      });

    });

    t.end();

  });

  test.test('region and dependency (that allow abbreviations) should honor them when available', function(t) {
    ['region', 'dependency'].forEach(function(place_type) {
      var wofRecords = {
        1: {
          id: 1,
          name: 'record name',
          abbreviation: 'record abbreviation',
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
          .addParent( place_type, 'record name', '1', 'record abbreviation')
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
      });

    });

    t.end();

  });

  test.test('wofRecord with bounding_box should have bounding box in Document', function(t) {
    var wofRecords = {
      1: {
        id: 1,
        name: 'name 1',
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

  test.test('country record without abbreviation should not set alpha3', function(t) {
    var wofRecords = {
      1: {
        id: 1,
        name: 'name 1',
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
        .setName('default', 'name 1')
        .setCentroid({ lat: 12.121212, lon: 21.212121 })
        .addParent('country', 'name 1', '1')
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
      t.deepEqual(actual, expected, 'there should be no alpha3');
      t.end();
    });

  });

  test.test('country record with unknown abbreviation should not set alpha3', function(t) {
    var wofRecords = {
      1: {
        id: 1,
        name: 'name 1',
        lat: 12.121212,
        lon: 21.212121,
        place_type: 'country',
        abbreviation: 'this is not a known ISO2 country code'
      }
    };

    // extract all the values from wofRecords to an array since that's how test_stream works
    // sure, this could be done with map, but this is clearer
    var input = [
      wofRecords['1']
    ];

    var expected = [
      new Document( 'whosonfirst', 'country', '1')
        .setName('default', 'name 1')
        .setCentroid({ lat: 12.121212, lon: 21.212121 })
        .addParent('country', 'name 1', '1')
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
      t.deepEqual(actual, expected, 'there should be no alpha3');
      t.end();
    });

  });

  test.test('undefined population should not set population in doc', function(t) {
    var wofRecords = {
      1: {
        id: 1,
        name: 'United States',
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
        .setAlpha3( 'USA' )
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
        .setAlpha3( 'USA' )
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
        .setAlpha3( 'USA' )
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
        .setAlpha3( 'USA' )
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

  test.test('a document should be created for each available hierarchy', function(t) {
    var wofRecords = {
      1: {
        id: 1,
        name: 'neighbourhood name',
        lat: 12.121212,
        lon: 21.212121,
        place_type: 'neighbourhood'
      },
      2: {
        id: 2,
        name: 'country name 1',
        lat: 13.131313,
        lon: 31.313131,
        place_type: 'country'
      },
      3: {
        id: 3,
        name: 'country name 2',
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
      new Document( 'whosonfirst', 'neighbourhood', '1')
        .setName('default', 'neighbourhood name')
        .setCentroid({ lat: 12.121212, lon: 21.212121 })
        .addParent( 'neighbourhood', 'neighbourhood name', '1')
        .addParent( 'country', 'country name 2', '3')
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

});
