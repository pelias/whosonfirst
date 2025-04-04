const tape = require('tape');
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

    temp.mkdir('tmp_sqlite', (err, temp_dir) => {
      generateWOFDB(path.join(temp_dir, 'sqlite', 'whosonfirst-data-admin-xy-latest.db'), [
        {
          id: 123,
          properties: {
            'wof:name': 'name 1',
            'wof:placetype': 'region',
            'geom:latitude': 12.121212,
            'geom:longitude': 21.212121,
            'wof:abbreviation': 'XY',
            'geom:bbox': '-13.691314,49.909613,1.771169,60.847886',
            'gn:population': 98765,
            'qs:photo_sum': 87654
          }
        }
      ]);

      generateWOFDB(path.join(temp_dir, 'sqlite', 'whosonfirst-data-admin-xx-latest.db'), [
        {
        id: 123,
        properties: {
          'wof:name': 'name 1',
          'wof:placetype': 'region',
          'geom:latitude': 12.121212,
          'geom:longitude': 21.212121,
          'wof:abbreviation': 'XY',
          'geom:bbox': '-13.691314,49.909613,1.771169,60.847886',
          'gn:population': 98765,
          'qs:photo_sum': 87654
        }
      },
      {
        id: 456,
        properties: {
          'wof:name': 'name 2',
          'wof:placetype': 'localadmin',
          'geom:latitude': 13.131313,
          'geom:longitude': 31.313131,
          'wof:abbreviation': 'XY',
          'geom:bbox': '-24.539906,34.815009,69.033946,81.85871'
        }
      },
      {
        id: 789,
        properties: {
          'wof:name': 'name 3',
          'wof:placetype': 'place type 3',
          'geom:latitude': 14.141414,
          'geom:longitude': 41.414141,
          'geom:bbox': '-24.539906,34.815009,69.033946,81.85871'
        }
      }
    ]);

      const wofConfig = {
        datapath: temp_dir,
        sqlite: true
      };

      const wofAdminRecords = {};
      const filenames = ['whosonfirst-data-admin-xy-latest.db', 'whosonfirst-data-admin-xx-latest.db'];
      const stream = readStream.create(wofConfig, filenames, wofAdminRecords);

      stream.on('finish', _ => {
        temp.cleanupSync();

        t.deepEquals(wofAdminRecords, {
          '123': {
            id: 123,
            name: 'name 1',
            name_aliases: [],
            name_langs: {},
            place_type: 'region',
            lat: 12.121212,
            lon: 21.212121,
            abbreviation: 'XY',
            bounding_box: '-13.691314,49.909613,1.771169,60.847886',
            population: 98765,
            popularity: 87654,
            hierarchies: [
              { 'region_id': 123 }
            ],
            concordances: {}
          },
          '456': {
            id: 456,
            name: 'name 2',
            name_aliases: [],
            name_langs: {},
            place_type: 'localadmin',
            lat: 13.131313,
            lon: 31.313131,
            abbreviation: 'XY',
            bounding_box: '-24.539906,34.815009,69.033946,81.85871',
            population: undefined,
            popularity: undefined,
            hierarchies: [
              { 'localadmin_id': 456 }
            ],
            concordances: {}
          }
        });

        const xyMessages = logger.getDebugMessages().filter(m => m.indexOf('whosonfirst-data-admin-xy-latest.db') >= 0);
        const xxMessages = logger.getDebugMessages().filter(m => m.indexOf('whosonfirst-data-admin-xx-latest.db') >= 0);

        t.deepEquals(xyMessages.length, 17);
        t.deepEquals(xyMessages.length, xxMessages.length);
        t.end();
      });
    });

  });

  test.test('load sqlite', t => {
    const logger = require('pelias-mock-logger')();

    const readStream = proxyquire('../src/readStream', {
      'pelias-logger': logger
    });
    temp.mkdir('tmp_sqlite', (err, temp_dir) => {
      generateWOFDB(path.join(temp_dir, 'sqlite', 'whosonfirst-data-latest.db'), [
        {
          id: 0,
          properties: {
            'wof:name': 'null island',
            'wof:placetype': 'country',
            'geom:latitude': 0,
            'geom:longitude': 0,
            'edtf:deprecated': 0,
            'wof:superseded_by': []
          }
        },
        {
          id: 421302191,
          properties: {
            'wof:name': 'name 421302191',
            'wof:placetype': 'region',
            'geom:latitude': 45.240295,
            'geom:longitude': 3.916216,
            'wof:superseded_by': []
          }
        },
        {
          id: 421302147,
          properties: {
            'wof:name': 'name 421302191',
            'wof:placetype': 'region',
            'geom:latitude': 45.240295,
            'geom:longitude': 3.916216,
            'wof:superseded_by': ['421302191']
          }
        },
        {
          id: 421302897,
          properties: {
            'wof:placetype': 'locality',
            'geom:latitude': 4.2564,
            'geom:longitude': -41.916216,
            'wof:superseded_by': []
          }
        }
      ]);
      const records = {};
      readStream
        .create({datapath: temp_dir, sqlite: true}, ['whosonfirst-data-latest.db'], records)
        .on('finish', (err) => {
          t.notOk(err);
          t.deepEquals(records, {
            '421302191': {
              id: 421302191,
              name: 'name 421302191',
              name_aliases: [],
              name_langs: {},
              abbreviation: undefined,
              place_type: 'region',
              lat: 45.240295,
              lon: 3.916216,
              bounding_box: undefined,
              population: undefined,
              popularity: undefined,
              hierarchies: [ { 'region_id': 421302191 } ],
              concordances: {}
            }
          });
          t.deepEqual(logger.getDebugMessages().length, 17);
          t.end();
        });
    });
  });
  test.end();
});
