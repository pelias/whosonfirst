var tape = require('tape');
var Document = require('pelias-model').Document;
var peliasDocGenerators = require('../src/peliasDocGenerators');
var event_stream = require('event-stream');

function test_stream(input, testedStream, callback) {
    var input_stream = event_stream.readArray(input);
    var destination_stream = event_stream.writeArray(callback);

    input_stream.pipe(testedStream).pipe(destination_stream);
}

tape('importStream', function(test) {
  test.test('wofRecords at all place_type levels should be returned as Document objects', function(t) {
    var wofRecords = {
      1: {
        id: 1,
        name: 'name 1',
        lat: 12.121212,
        lon: 21.212121,
        parent_id: undefined,
        place_type: 'country',
        bounding_box: '-13.691314,49.909613,1.771169,60.847886'
      },
      2: {
        id: 2,
        name: 'name 2',
        lat: 13.131313,
        lon: 31.313131,
        parent_id: 1,
        place_type: 'region',
        bounding_box: '-13.691314,49.909613,1.771169,60.847887'
      },
      3: {
        id: 3,
        name: 'name 3',
        lat: 14.141414,
        lon: 41.414141,
        parent_id: 2,
        place_type: 'county',
        bounding_box: '-13.691314,49.909613,1.771169,60.847888'
      },
      4: {
        id: 4,
        name: 'name 4',
        lat: 15.151515,
        lon: 51.515151,
        parent_id: 3,
        place_type: 'locality',
        bounding_box: '-13.691314,49.909613,1.771169,60.847889'
      }
    };

    // extract all the values from wofRecords to an array since that's how test_stream works
    // sure, this could be done with map, but this is clearer
    var input = [
      wofRecords['1'],
      wofRecords['2'],
      wofRecords['3'],
      wofRecords['4']
    ];

    var expected = [
      new Document( 'whosonfirst', '1' )
        .setName('default', 'name 1')
        .setCentroid({ lat: 12.121212, lon: 21.212121 })
        .setAdmin( 'admin0', 'name 1')
        .setBoundingBox({ upperLeft: { lat:60.847886, lon:-13.691314 }, lowerRight: { lat:49.909613 , lon:1.771169 }}),
      new Document( 'whosonfirst', '2')
        .setName('default', 'name 2')
        .setCentroid({ lat: 13.131313, lon: 31.313131 })
        .setAdmin( 'admin1', 'name 2')
        .setAdmin( 'admin0', 'name 1')
        .setBoundingBox({ upperLeft: { lat:60.847887, lon:-13.691314 }, lowerRight: { lat:49.909613 , lon:1.771169 }}),
      new Document( 'whosonfirst', '3')
        .setName('default', 'name 3')
        .setCentroid({ lat: 14.141414, lon: 41.414141 })
        .setAdmin( 'admin2', 'name 3')
        .setAdmin( 'admin1', 'name 2')
        .setAdmin( 'admin0', 'name 1')
        .setBoundingBox({ upperLeft: { lat:60.847888, lon:-13.691314 }, lowerRight: { lat:49.909613 , lon:1.771169 }}),
      new Document( 'whosonfirst', '4')
        .setName('default', 'name 4')
        .setCentroid({ lat: 15.151515, lon: 51.515151 })
        .setAdmin( 'locality', 'name 4')
        .setAdmin( 'admin2', 'name 3')
        .setAdmin( 'admin1', 'name 2')
        .setAdmin( 'admin0', 'name 1')
        .setBoundingBox({ upperLeft: { lat:60.847889, lon:-13.691314 }, lowerRight: { lat:49.909613 , lon:1.771169 }})
    ];

    // seed the parent_id_walker with wofRecords
    var parent_id_walker = peliasDocGenerators.parent_id_walker(wofRecords);

    test_stream(input, parent_id_walker, function(err, actual) {
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
      new Document( 'whosonfirst', '1' )
        .setName('default', 'name 1')
        .setCentroid({ lat: 12.121212, lon: 21.212121 })
    ];

    // seed the parent_id_walker with wofRecords
    var parent_id_walker = peliasDocGenerators.parent_id_walker(wofRecords);

    test_stream(input, parent_id_walker, function(err, actual) {
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
        bounding_box: '-13.691314,49.909613,1.771169,60.847886'
      }
    };

    var input = [
      wofRecords['1']
    ];

    var expected = [
      new Document( 'whosonfirst', '1' )
        .setCentroid({ lat: 12.121212, lon: 21.212121 })
        .setBoundingBox({ upperLeft: { lat:60.847886, lon:-13.691314 }, lowerRight: { lat:49.909613 , lon:1.771169 }}),
    ];

    // seed the parent_id_walker with wofRecords
    var parent_id_walker = peliasDocGenerators.parent_id_walker(wofRecords);

    test_stream(input, parent_id_walker, function(err, actual) {
      t.deepEqual(actual, expected, 'should have returned true');
      t.end();
    });

  });

});
