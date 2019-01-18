const tape = require('tape');
const fs = require('fs-extra');
const path = require('path');
const temp = require('temp').track();
const proxyquire = require('proxyquire').noCallThru();
const through2 = require('through2');
const generateWOFDB = require('./generateWOFDB');

tape('readStream', (test) => {
  test.test('readStream should return from all requested types and populate wofAdminRecords', (t) => {
    const logger = require('pelias-mock-logger')();

    const readStream = proxyquire('../src/readStream', {
      'pelias-logger': logger
    });

    temp.mkdir('tmp_wof', (err, temp_dir) => {
      fs.mkdirSync(path.join(temp_dir, 'meta'));
      fs.mkdirSync(path.join(temp_dir, 'data'));

      fs.writeFileSync(path.join(temp_dir, 'meta', 'whosonfirst-data-type1-latest.csv'), 'id,path\n123,123.geojson\n');
      fs.writeFileSync(path.join(temp_dir, 'data', '123.geojson'), JSON.stringify({
        id: 123,
        properties: {
          'wof:name': 'name 1',
          'wof:placetype': 'place type 1',
          'geom:latitude': 12.121212,
          'geom:longitude': 21.212121,
          'wof:abbreviation': 'XY',
          'geom:bbox': '-13.691314,49.909613,1.771169,60.847886',
          'gn:population': 98765,
          'misc:photo_sum': 87654
        }
      }));

      // write out second meta and data files
      fs.writeFileSync(path.join(temp_dir, 'meta', 'whosonfirst-data-type2-latest.csv'), 'id,path\n456,456.geojson\n');
      fs.writeFileSync(path.join(temp_dir, 'data', '456.geojson'), JSON.stringify({
        id: 456,
        properties: {
          'wof:name': 'name 2',
          'wof:placetype': 'place type 2',
          'geom:latitude': 13.131313,
          'geom:longitude': 31.313131,
          'wof:abbreviation': 'XY',
          'geom:bbox': '-24.539906,34.815009,69.033946,81.85871'
        }
      }));

      // write out third meta and data files that are ignored
      // it will be ignored since 'type3' is not passed as a supported type
      // this shows that types are supported instead of all files being globbed
      fs.writeFileSync(path.join(temp_dir, 'meta', 'whosonfirst-data-type3-latest.csv'), 'id,path\n789,789.geojson\n');
      fs.writeFileSync(path.join(temp_dir, 'data', '789.geojson'), JSON.stringify({
        id: 789,
        properties: {
          'wof:name': 'name 3',
          'wof:placetype': 'place type 3',
          'geom:latitude': 14.141414,
          'geom:longitude': 41.414141,
          'geom:bbox': '-24.539906,34.815009,69.033946,81.85871'
        }
      }));

      const wofConfig = {
        datapath: temp_dir,
        missingFilesAreFatal: false
      };

      const wofAdminRecords = {};
      const filenames = ['whosonfirst-data-type1-latest.csv', 'whosonfirst-data-type2-latest.csv'];
      const stream = readStream.create(wofConfig, filenames, wofAdminRecords);

      stream.on('finish', _ => {
        temp.cleanupSync();

        t.deepEquals(wofAdminRecords, {
          '123': {
            id: 123,
            name: 'name 1',
            place_type: 'place type 1',
            lat: 12.121212,
            lon: 21.212121,
            abbreviation: 'XY',
            bounding_box: '-13.691314,49.909613,1.771169,60.847886',
            population: 98765,
            popularity: 87654,
            hierarchies: [
              { 'place type 1_id': 123 }
            ]
          },
          '456': {
            id: 456,
            name: 'name 2',
            place_type: 'place type 2',
            lat: 13.131313,
            lon: 31.313131,
            abbreviation: 'XY',
            bounding_box: '-24.539906,34.815009,69.033946,81.85871',
            population: undefined,
            popularity: undefined,
            hierarchies: [
              { 'place type 2_id': 456 }
            ]
          }
        });

        t.deepEquals(logger.getInfoMessages(), [
          `Loading whosonfirst-data-type1-latest.csv records from ${temp_dir}/meta`,
          `Loading whosonfirst-data-type2-latest.csv records from ${temp_dir}/meta`
        ]);
        t.end();

      });

    });

  });

  test.test('missingFilesAreFatal=false from config should be passed to loadJSON', (t) => {
    temp.mkdir('tmp_wof', (err, temp_dir) => {
      t.plan(2, 'plan for 2 tests so we know that loadJSON was actually used');

      const readStream = proxyquire('../src/readStream', {
        './components/loadJSON': {
          create: (wofRoot, missingFilesAreFatal) => {
            t.equals(wofRoot, temp_dir);
            t.equals(missingFilesAreFatal, false);
            return through2.obj();
          }
        }
      });

      const wofConfig = {
        datapath: temp_dir,
        missingFilesAreFatal: false
      };

      const wofAdminRecords = {};
      const stream = readStream.create(wofConfig, [], wofAdminRecords);

      stream.on('finish', _ => {
        temp.cleanupSync();
        t.end();
      });

    });
  });

  test.test('missingFilesAreFatal=true from config should be passed to loadJSON', (t) => {
    temp.mkdir('tmp_wof', (err, temp_dir) => {
      t.plan(2, 'plan for 2 tests so we know that loadJSON was actually used');

      const readStream = proxyquire('../src/readStream', {
        './components/loadJSON': {
          create: (wofRoot, missingFilesAreFatal) => {
            t.equals(wofRoot, temp_dir);
            t.equals(missingFilesAreFatal, true);
            return through2.obj();
          }
        }
      });

      const wofConfig = {
        datapath: temp_dir,
        missingFilesAreFatal: true
      };

      const wofAdminRecords = {};
      const stream = readStream.create(wofConfig, [], wofAdminRecords);

      stream.on('finish', _ => {
        temp.cleanupSync();
        t.end();
      });

    });
  });
  test.end();

  test.test('load sqlite', t => {
    temp.mkdir('tmp_sqlite', (err, temp_dir) => {
      const db = generateWOFDB(path.join(temp_dir, 'sqlite', 'whosonfirst-data-latest.db'), [
        {
          id: 0,
          'wof:placetype': 'country',
          properties: {
            'wof:name': 'null island',
            'geom:latitude': 0,
            'geom:longitude': 0,
            'edtf:deprecated': 0,
            'wof:superseded_by': []
          }
        },
        {
          id: 421302191,
          'wof:placetype': 'region',
          properties: {
            'wof:name': 'name 421302191',
            'geom:latitude': 45.240295,
            'geom:longitude': 3.916216,
            'wof:superseded_by': []
          }
        },
        {
          id: 421302147,
          'wof:placetype': 'region',
          properties: {
            'wof:name': 'name 421302191',
            'geom:latitude': 45.240295,
            'geom:longitude': 3.916216,
            'wof:superseded_by': ['421302191']
          }
        },
        {
          id: 421302897,
          'wof:placetype': 'locality',
          properties: {
            'geom:latitude': 4.2564,
            'geom:longitude': -41.916216,
            'wof:superseded_by': []
          }
        }
      ]);
      const records = {};
      require('../src/readStream')
        .create({datapath: temp_dir, sqlite: true}, ['whosonfirst-data-latest.db'], records)
        .on('finish', (err) => {
          t.notOk(err);
          t.deepEquals(records, {
            '421302191': {
              id: 421302191,
              name: 'name 421302191',
              abbreviation: undefined,
              place_type: undefined,
              lat: 45.240295,
              lon: 3.916216,
              bounding_box: undefined,
              population: undefined,
              popularity: undefined,
              hierarchies: []
            }
          });
          t.end();
        });
    });
  });

});
