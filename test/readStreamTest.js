var tape = require('tape');
var event_stream = require('event-stream');
var fs = require('fs-extra');

var readStream = require('../src/readStream');

tape('readStream', function(test) {
  /*
    this test is not terribly attractive, i'm not happy with it but setup wasn't
    all that painful.
  */
  test.test('readStream should return from all requested types and populate wofRecords', function(t) {
    // remove tmp directory if for some reason it's been hanging around from a previous run
    fs.removeSync('tmp');

    // shell out since creating multiple levels of directories in node is tedious
    fs.mkdirsSync('tmp/meta');
    fs.mkdirsSync('tmp/data/1/2/3');
    fs.mkdirsSync('tmp/data/5/6/7');
    fs.mkdirsSync('tmp/data/9/10/11');

    // write out first meta and data files
    fs.writeFileSync('tmp/meta/wof-type1-latest.csv', 'path\n1/2/3/4.geojson\n');
    fs.writeFileSync('tmp/data/1/2/3/4.geojson', JSON.stringify({
      id: 4,
      properties: {
        'wof:name': 'name 1',
        'wof:placetype': 'place type 1',
        'wof:parent_id': 2,
        'geom:latitude': 12.121212,
        'geom:longitude': 21.212121
      }
    }));

    // write out second meta and data files
    fs.writeFileSync('tmp/meta/wof-type2-latest.csv', 'path\n5/6/7/8.geojson\n');
    fs.writeFileSync('tmp/data/5/6/7/8.geojson', JSON.stringify({
      id: 8,
      properties: {
        'wof:name': 'name 2',
        'wof:placetype': 'place type 2',
        'wof:parent_id': 3,
        'geom:latitude': 13.131313,
        'geom:longitude': 31.313131
      }
    }));

    // write out third meta and data files that are ignored
    fs.writeFileSync('tmp/meta/wof-type3-latest.csv', 'path\n9/10/11/12.geojson\n');
    fs.writeFileSync('tmp/data/9/10/11/12.geojson', JSON.stringify({
      id: 12,
      properties: {
        'wof:name': 'name 3',
        'wof:placetype': 'place type 3',
        'wof:parent_id': 4,
        'geom:latitude': 14.141414,
        'geom:longitude': 41.414141
      }
    }));

    var wofRecords = {};

    readStream('./tmp/', ['type1', 'type2'], wofRecords, function() {
      t.equals(Object.keys(wofRecords).length, 2, 'there should be 2 records loaded');

      t.deepEqual(wofRecords[4], {
        id: 4,
        name: 'name 1',
        place_type: 'place type 1',
        parent_id: 2,
        lat: 12.121212,
        lon: 21.212121
      }, 'id 4 should have been loaded');

      t.deepEqual(wofRecords[8], {
        id: 8,
        name: 'name 2',
        place_type: 'place type 2',
        parent_id: 3,
        lat: 13.131313,
        lon: 31.313131
      }, 'id 8 should have been loaded');

      // cleanup
      fs.removeSync('tmp');

      t.end();

    });

  });

});
