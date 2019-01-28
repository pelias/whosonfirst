const combinedStream = require('combined-stream');
const fs = require('fs');
const path = require('path');
const Sqlite3 = require('better-sqlite3');
const SQLiteStream = require('../../src/components/sqliteStream');
const tape = require('tape');
const temp = require('temp').track();
const through2 = require('through2');

tape('SQLiteStream', (test) => {
  test.test('Should be a read stream', (t) => {
    temp.mkdir('tmp_SQLite_db', (err, temp_dir) => {
      const dbPath = path.join(temp_dir, 'stream_test.db');
      const tmpDB = new Sqlite3(dbPath)
        .exec('CREATE TABLE wof(id INT)')
        .exec('INSERT INTO wof(id) VALUES (0), (1), (2)');
      const sqliteStream = new SQLiteStream(dbPath, 'SELECT * FROM wof');
      const res = [];
      sqliteStream.pipe(through2.obj((data, enc, next) => {
        res.push(data.id);
        next();
      })).on('finish', () => {
        temp.cleanup((err) => {
          tmpDB.close();
          t.notOk(err);
          t.deepEqual([0, 1, 2], res);
          t.notOk(sqliteStream._db.open, 'database should be closed at the end');
          t.end();
        });
      });
    });
  });

  test.test('Should be used with combinedStream', (t) => {
    temp.mkdir('tmp_SQLite_combinedStream', (err, temp_dir) => {
      const stream = combinedStream.create();
      const streams = ['combinedStream1.db', 'combinedStream2.db'].map((e, idx) => {
        const delta = idx === 0 ? 0 : 3;
        const dbPath = path.join(temp_dir, e);
        const tmpDB = new Sqlite3(dbPath)
          .exec('CREATE TABLE wof(id INT)')
          .exec(`INSERT INTO wof(id) VALUES (${delta + 0}), (${delta + 1}), (${delta + 2})`);
        stream.append(next => {
          next(new SQLiteStream(dbPath, 'SELECT * FROM wof'));
        });
        return tmpDB;
      });
      const res = [];
      stream.pipe(through2.obj((data, enc, next) => {
        res.push(data.id);
        next();
      })).on('finish', () => {
        temp.cleanup((err) => {
          streams.forEach(s => s.close());
          t.notOk(err);
          t.deepEqual(res, [0, 1, 2, 3, 4, 5]);
          t.end();
        });
      });
    });
  });

  test.test('Should generate correct sqlite statement when findGeoJSONByPlacetype is used', t => {
    t.ok(SQLiteStream.findGeoJSONByPlacetype(undefined).indexOf(`spr.placetype IN ('')`) >= 0,
        'Should change undefined value to empty string');
    t.ok(SQLiteStream.findGeoJSONByPlacetype(42).indexOf(`spr.placetype IN ('42')`) >= 0,
        'Should change number to string');
    t.ok(SQLiteStream.findGeoJSONByPlacetype('placetype').indexOf(`spr.placetype IN ('placetype')`) >= 0,
        'Should format correctly strings');
    t.ok(SQLiteStream.findGeoJSONByPlacetype(['locality', 'localadmin']).indexOf(`spr.placetype IN ('locality','localadmin')`) >= 0,
        'Should format correctly array of strings');
    t.end();
  });
});