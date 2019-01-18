const _ = require('lodash');
const path = require('path');
const fs = require('fs-extra');
const Sqlite3 = require('better-sqlite3');

module.exports = (dbPath, entries) => {
  fs.ensureDirSync(path.dirname(dbPath));
  const db = new Sqlite3(dbPath)
    .exec(`CREATE TABLE geojson (
        		id INTEGER NOT NULL PRIMARY KEY,
        		body TEXT,
        		lastmodified INTEGER
          )`)
    .exec(`CREATE TABLE spr (
          	id INTEGER NOT NULL PRIMARY KEY,
          	parent_id INTEGER,
          	name TEXT,
          	placetype TEXT,
          	country TEXT,
          	repo TEXT,
          	latitude REAL,
          	longitude REAL,
          	min_latitude REAL,
          	min_longitude REAL,
          	max_latitude REAL,
          	max_longitude REAL,
          	is_current INTEGER,
          	is_deprecated INTEGER,
          	is_ceased INTEGER,
          	is_superseded INTEGER,
          	is_superseding INTEGER,
          	superseded_by TEXT,
          	supersedes TEXT,
          	lastmodified INTEGER
          )`);
  if (_.isArray(entries)) {
    entries.forEach(e => {
      db
      .exec(`INSERT INTO geojson(id, body) VALUES (${e.id}, '${JSON.stringify(e)}')`)
      .exec(`INSERT INTO spr(id, name, placetype, latitude, longitude, is_deprecated, is_superseded) VALUES (
        ${e.id},
        '${e.properties['wof:name'] || ''}',
        '${e['wof:placetype']}',
        ${e.properties['geom:latitude']},
        ${e.properties['geom:longitude']},
        ${_.isEmpty(e.properties['edtf:deprecated']) ? 0 : 1},
        ${_.isEmpty(e.properties['wof:superseded_by']) ? 0 : 1}
      )`);
    });
  }
  return db;
};