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
  test.test('wofRecords at all place_type levels should be returned as Document objects', function(t) {
    var wofRecords = {
      1: {
        id: 1,
        name: 'name 1',
        lat: 12.121212,
        lon: 21.212121,
        place_type: 'country',
        bounding_box: '-13.691314,49.909613,1.771169,60.847886',
        iso2: 'DE'
      },
      2: {
        id: 2,
        name: 'name 2',
        lat: 13.131313,
        lon: 31.313131,
        place_type: 'dependency',
        bounding_box: '-13.691314,49.909613,1.771169,60.847887'
      },
      3: {
        id: 3,
        name: 'name 3',
        lat: 14.141414,
        lon: 41.414141,
        place_type: 'macroregion',
        bounding_box: '-13.691314,49.909613,1.771169,60.847888'
      },
      4: {
        id: 4,
        name: 'name 4',
        lat: 15.151515,
        lon: 51.515151,
        place_type: 'region',
        bounding_box: '-13.691314,49.909613,1.771169,60.847889'
      },
      5: {
        id: 5,
        name: 'name 5',
        lat: 16.161616,
        lon: 61.616161,
        place_type: 'macrocounty',
        bounding_box: '-13.691314,49.909613,1.771169,60.847890'
      },
      6: {
        id: 6,
        name: 'name 6',
        lat: 17.171717,
        lon: 71.717171,
        place_type: 'county',
        bounding_box: '-13.691314,49.909613,1.771169,60.847891'
      },
      7: {
        id: 7,
        name: 'name 7',
        lat: 18.181818,
        lon: 81.818181,
        place_type: 'localadmin',
        bounding_box: '-13.691314,49.909613,1.771169,60.847892'
      },
      8: {
        id: 8,
        name: 'name 8',
        lat: 19.191919,
        lon: 91.919191,
        place_type: 'borough',
        bounding_box: '-13.691314,49.909613,1.771169,60.847893'
      },
      9: {
        id: 9,
        name: 'name 9',
        lat: 10.101010,
        lon: 1.010101,
        place_type: 'locality',
        bounding_box: '-13.691314,49.909613,1.771169,60.847894',
        iso2: 'this will be ignored'
      }
    };

    // extract all the values from wofRecords to an array since that's how test_stream works
    // sure, this could be done with map, but this is clearer
    var input = [
      wofRecords['9']
    ];

    var expected = [
      new Document( 'whosonfirst', 'locality', '9')
        .setName('default', 'name 9')
        .setCentroid({ lat: 10.101010, lon: 1.010101 })
        .addParent( 'locality', 'name 9', '9')
        .addParent( 'borough', 'name 8', '8')
        .addParent( 'localadmin', 'name 7', '7')
        .addParent( 'county', 'name 6', '6')
        .addParent( 'macrocounty', 'name 5', '5')
        .addParent( 'region', 'name 4', '4')
        .addParent( 'macroregion', 'name 3', '3')
        .addParent( 'dependency', 'name 2', '2')
        .addParent( 'country', 'name 1', '1', 'DEU')
        .setAlpha3( 'DEU' )
        .setBoundingBox({ upperLeft: { lat:60.847894, lon:-13.691314 }, lowerRight: { lat:49.909613 , lon:1.771169 }})
    ];

    var hierarchies_finder = function() {
      return [
        wofRecords['9'],
        wofRecords['8'],
        wofRecords['7'],
        wofRecords['6'],
        wofRecords['5'],
        wofRecords['4'],
        wofRecords['3'],
        wofRecords['2'],
        wofRecords['1']
      ];
    };

    // seed the parent_id_walker with wofRecords
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
        parent_id: undefined,
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

    // seed the parent_id_walker with wofRecords
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
        parent_id: undefined,
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

    // seed the parent_id_walker with wofRecords
    var docGenerator = peliasDocGenerators.create(hierarchies_finder);

    test_stream(input, docGenerator, function(err, actual) {
      t.deepEqual(actual, expected, 'should have returned true');
      t.end();
    });

  });

  test.test('record without iso2 should not set alpha3', function(t) {
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
        wofRecords['1']
      ];
    };

    // seed the parent_id_walker with wofRecords
    var docGenerator = peliasDocGenerators.create(hierarchies_finder);

    test_stream(input, docGenerator, function(err, actual) {
      t.deepEqual(actual, expected, 'there should be no alpha3');
      t.end();
    });

  });

  test.test('record with unknown iso2 should not set alpha3', function(t) {
    var wofRecords = {
      1: {
        id: 1,
        name: 'name 1',
        lat: 12.121212,
        lon: 21.212121,
        place_type: 'country',
        iso2: 'this is not a known ISO2 country code'
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
        wofRecords['1']
      ];
    };

    // seed the parent_id_walker with wofRecords
    var docGenerator = peliasDocGenerators.create(hierarchies_finder);

    test_stream(input, docGenerator, function(err, actual) {
      t.deepEqual(actual, expected, 'there should be no alpha3');
      t.end();
    });

  });

  test.test('known US state name should be also set region_a in doc', function(t) {
    var wofRecords = {
      1: {
        id: 1,
        name: 'United States',
        lat: 12.121212,
        lon: 21.212121,
        place_type: 'country',
        iso2: 'US'
      },
      2: {
        id: 2,
        name: 'New York',
        lat: 13.131313,
        lon: 31.313131,
        place_type: 'region',
        abbreviation: 'NY'
      },
      3: {
        id: 3,
        name: 'Kings',
        lat: 14.141414,
        lon: 41.414141,
        place_type: 'county'
      },
      4: {
        id: 4,
        name: 'New York City',
        lat: 15.151515,
        lon: 51.515151,
        place_type: 'locality'
      }
    };

    // extract all the values from wofRecords to an array since that's how test_stream works
    // sure, this could be done with map, but this is clearer
    var input = [
      wofRecords['4']
    ];

    var expected = [
      new Document( 'whosonfirst', 'locality', '4')
        .setName('default', 'New York City')
        .setCentroid({ lat: 15.151515, lon: 51.515151 })
        .addParent('locality', 'New York City', '4')
        .addParent('county', 'Kings', '3')
        .addParent('region', 'New York', '2', 'NY')
        .addParent('country', 'United States', '1', 'USA')
        .setAlpha3( 'USA' )
    ];

    var hierarchies_finder = function() {
      return [
        wofRecords['4'],
        wofRecords['3'],
        wofRecords['2'],
        wofRecords['1']
      ];
    };

    // seed the parent_id_walker with wofRecords
    var docGenerator = peliasDocGenerators.create(hierarchies_finder);

    test_stream(input, docGenerator, function(err, actual) {
      t.deepEqual(actual, expected, 'admin1_abbr should be set to the corresponding abbreviation');
      t.end();
    });

  });

  test.test('undefined abbreviation should not set region_a in doc', function(t) {
    var wofRecords = {
      1: {
        id: 1,
        name: 'United States',
        lat: 12.121212,
        lon: 21.212121,
        place_type: 'country',
        iso2: 'US'
      },
      2: {
        id: 2,
        name: 'New York',
        lat: 13.131313,
        lon: 31.313131,
        place_type: 'region'
      },
      3: {
        id: 3,
        name: 'Kings',
        lat: 14.141414,
        lon: 41.414141,
        place_type: 'county'
      },
      4: {
        id: 4,
        name: 'New York City',
        lat: 15.151515,
        lon: 51.515151,
        place_type: 'locality'
      }
    };

    // extract all the values from wofRecords to an array since that's how test_stream works
    // sure, this could be done with map, but this is clearer
    var input = [
      wofRecords['4']
    ];

    var expected = [
      new Document( 'whosonfirst', 'locality', '4')
        .setName('default', 'New York City')
        .setCentroid({ lat: 15.151515, lon: 51.515151 })
        .addParent('locality', 'New York City', '4')
        .addParent('county', 'Kings', '3')
        .addParent('region', 'New York', '2')
        .addParent('country', 'United States', '1', 'USA')
        .setAlpha3( 'USA' )
    ];

    var hierarchies_finder = function() {
      return [
        wofRecords['4'],
        wofRecords['3'],
        wofRecords['2'],
        wofRecords['1']
      ];
    };

    // seed the parent_id_walker with wofRecords
    var docGenerator = peliasDocGenerators.create(hierarchies_finder);

    test_stream(input, docGenerator, function(err, actual) {
      t.deepEqual(actual, expected, 'admin1_abbr should be set to the corresponding abbreviation');
      t.end();
    });

  });

  test.test('undefined abbreviation should not set region_a in doc', function(t) {
    var wofRecords = {
      1: {
        id: 1,
        name: 'United States',
        lat: 12.121212,
        lon: 21.212121,
        place_type: 'country',
        iso2: 'US'
      },
      2: {
        id: 2,
        name: 'New York',
        lat: 13.131313,
        lon: 31.313131,
        place_type: 'region',
        abbreviation: undefined
      },
      3: {
        id: 3,
        name: 'Kings',
        lat: 14.141414,
        lon: 41.414141,
        place_type: 'county'
      },
      4: {
        id: 4,
        name: 'New York City',
        lat: 15.151515,
        lon: 51.515151,
        place_type: 'locality'
      }
    };

    // extract all the values from wofRecords to an array since that's how test_stream works
    // sure, this could be done with map, but this is clearer
    var input = [
      wofRecords['4']
    ];

    var expected = [
      new Document( 'whosonfirst', 'locality', '4')
        .setName('default', 'New York City')
        .setCentroid({ lat: 15.151515, lon: 51.515151 })
        .addParent('locality', 'New York City', '4')
        .addParent('county', 'Kings', '3')
        .addParent('region', 'New York', '2')
        .addParent('country', 'United States', '1', 'USA')
        .setAlpha3( 'USA' )
    ];

    var hierarchies_finder = function() {
      return [
        wofRecords['4'],
        wofRecords['3'],
        wofRecords['2'],
        wofRecords['1']
      ];
    };

    // seed the parent_id_walker with wofRecords
    var docGenerator = peliasDocGenerators.create(hierarchies_finder);

    test_stream(input, docGenerator, function(err, actual) {
      t.deepEqual(actual, expected, 'admin1_abbr should be set to the corresponding abbreviation');
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
        iso2: 'US',
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
        wofRecords['1']
      ];
    };

    // seed the parent_id_walker with wofRecords
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
        iso2: 'US',
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
        wofRecords['1']
      ];
    };

    // seed the parent_id_walker with wofRecords
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
        iso2: 'US',
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
        wofRecords['1']
      ];
    };

    // seed the parent_id_walker with wofRecords
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
        iso2: 'US',
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
        wofRecords['1']
      ];
    };

    // seed the parent_id_walker with wofRecords
    var docGenerator = peliasDocGenerators.create(hierarchies_finder);

    test_stream(input, docGenerator, function(err, actual) {
      t.deepEqual(actual, expected, 'population should not be set');
      t.end();
    });

  });

});
