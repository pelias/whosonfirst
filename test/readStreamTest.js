var tape = require('tape');
var fs = require('fs-extra');
var sink = require('through2-sink');

var readStream = require('../src/readStream');

tape('readStream', function(test) {
  /*
    this test is not terribly attractive, i'm not happy with it but setup wasn't
    all that painful.
  */
  test.test('readStream should return from all requested types and populate wofAdminRecords', function(t) {
    function setupTestEnvironment() {
      // remove tmp directory if for some reason it's been hanging around from a previous run
      fs.removeSync('tmp');

      fs.mkdirsSync('tmp/meta');

      // write out first meta and data files
      fs.writeFileSync('tmp/meta/wof-type1-latest.csv', 'id,path\n1234567,123/456/7/1234567.geojson\n');
      fs.mkdirsSync('tmp/data/123/456/7');
      fs.writeFileSync('tmp/data/123/456/7/1234567.geojson', JSON.stringify({
        id: 1234567,
        properties: {
          'wof:name': 'name 1',
          'wof:placetype': 'place type 1',
          'wof:parent_id': 2,
          'geom:latitude': 12.121212,
          'geom:longitude': 21.212121,
          'iso:country': 'YZ',
          'wof:abbreviation': 'XY',
          'geom:bbox': '-13.691314,49.909613,1.771169,60.847886',
          'gn:population': 98765,
          'misc:photo_sum': 87654
        }
      }));

      // write out second meta and data files
      fs.writeFileSync('tmp/meta/wof-type2-latest.csv', 'id,path\n12345678,123/456/78/12345678.geojson\n');
      fs.mkdirsSync('tmp/data/123/456/78');
      fs.writeFileSync('tmp/data/123/456/78/12345678.geojson', JSON.stringify({
        id: 12345678,
        properties: {
          'wof:name': 'name 2',
          'wof:placetype': 'place type 2',
          'wof:parent_id': 3,
          'geom:latitude': 13.131313,
          'geom:longitude': 31.313131,
          'iso:country': 'XZ',
          'wof:abbreviation': 'XY',
          'geom:bbox': '-24.539906,34.815009,69.033946,81.85871'
        }
      }));

      // write out third meta and data files that are ignored
      // it will be ignored since 'type3' is not passed as a supported type
      // this shows that types are supported instead of all files being globbed
      fs.writeFileSync('tmp/meta/wof-type3-latest.csv', 'id,path\n123456789,123/456/789/123456789.geojson\n');
      fs.mkdirsSync('tmp/data/123/456/789');
      fs.writeFileSync('tmp/data/123/456/789/123456789.geojson', JSON.stringify({
        id: 123456789,
        properties: {
          'wof:name': 'name 3',
          'wof:placetype': 'place type 3',
          'wof:parent_id': 4,
          'geom:latitude': 14.141414,
          'geom:longitude': 41.414141,
          'geom:bbox': '-24.539906,34.815009,69.033946,81.85871'
        }
      }));
    }

    function cleanupTestEnvironment() {
      fs.removeSync('tmp');
    }

    setupTestEnvironment();

    var wofAdminRecords = {};
    var stream = readStream.create('./tmp/', ['type1', 'type2'], wofAdminRecords);

    stream.pipe(sink.obj(function() {})).on('finish', function() {
      t.equals(Object.keys(wofAdminRecords).length, 2, 'there should be 2 records loaded');

      t.deepEqual(wofAdminRecords[1234567], {
        id: 1234567,
        name: 'name 1',
        place_type: 'place type 1',
        parent_id: 2,
        lat: 12.121212,
        lon: 21.212121,
        iso2: 'YZ',
        abbreviation: 'XY',
        bounding_box: '-13.691314,49.909613,1.771169,60.847886',
        population: 98765,
        popularity: 87654
      }, 'id 1234567 should have been loaded');

      t.deepEqual(wofAdminRecords[12345678], {
        id: 12345678,
        name: 'name 2',
        place_type: 'place type 2',
        parent_id: 3,
        lat: 13.131313,
        lon: 31.313131,
        iso2: 'XZ',
        abbreviation: 'XY',
        bounding_box: '-24.539906,34.815009,69.033946,81.85871',
        population: undefined,
        popularity: undefined
      }, 'id 12345678 should have been loaded');

      t.end();

      cleanupTestEnvironment();
    });
  });
});
