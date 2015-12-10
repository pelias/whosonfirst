var tape = require('tape');
var importStream = require('../src/importStream');
var sink = require('through2-sink');
var Document = require('pelias-model').Document;

tape('importStream', function(test) {
  test.test('asdf', function(t) {
    var docs = [];

    var destination_pipe = sink.obj(function(record) {
      docs.push(record);
    });

    var wofRecords = {
      1: {
        id: 1,
        name: 'name 1',
        lat: 12.121212,
        lon: 21.212121,
        parent_id: undefined,
        place_type: 'country'
      },
      2: {
        id: 2,
        name: 'name 2',
        lat: 13.131313,
        lon: 31.313131,
        parent_id: 1,
        place_type: 'region'
      },
      3: {
        id: 3,
        name: 'name 3',
        lat: 14.141414,
        lon: 41.414141,
        parent_id: 2,
        place_type: 'county'
      },
      4: {
        id: 4,
        name: 'name 4',
        lat: 15.151515,
        lon: 51.515151,
        parent_id: 3,
        place_type: 'locality'
      },
      5: {
        id: 5,
        lat: 16.161616,
        lon: 61.616161,
        parent_id: undefined,
        place_type: 'country'
      }
    };

    importStream(wofRecords, destination_pipe, function() {
      t.equal(docs.length, 5);

      var expectedDoc1 = new Document( 'whosonfirst', '1' )
        .setName('default', 'name 1')
        .setCentroid({ lat: 12.121212, lon: 21.212121 })
        .setAdmin( 'admin0', 'name 1');

      var expectedDoc2 = new Document( 'whosonfirst', '2')
        .setName('default', 'name 2')
        .setCentroid({ lat: 13.131313, lon: 31.313131 })
        .setAdmin( 'admin1', 'name 2')
        .setAdmin( 'admin0', 'name 1');

      var expectedDoc3 = new Document( 'whosonfirst', '3')
        .setName('default', 'name 3')
        .setCentroid({ lat: 14.141414, lon: 41.414141 })
        .setAdmin( 'admin2', 'name 3')
        .setAdmin( 'admin1', 'name 2')
        .setAdmin( 'admin0', 'name 1');

      var expectedDoc4 = new Document( 'whosonfirst', '4')
        .setName('default', 'name 4')
        .setCentroid({ lat: 15.151515, lon: 51.515151 })
        .setAdmin( 'locality', 'name 4')
        .setAdmin( 'admin2', 'name 3')
        .setAdmin( 'admin1', 'name 2')
        .setAdmin( 'admin0', 'name 1');

      var expectedDoc5 = new Document( 'whosonfirst', '5' )
        .setCentroid({ lat: 16.161616, lon: 61.616161 });

      t.deepEqual(expectedDoc1, docs[0]);
      t.deepEqual(expectedDoc2, docs[1]);
      t.deepEqual(expectedDoc3, docs[2]);
      t.deepEqual(expectedDoc4, docs[3]);
      t.deepEqual(expectedDoc5, docs[4]);

      t.end();

    });

  });

});
