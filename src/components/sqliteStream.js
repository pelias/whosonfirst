const Readable = require('stream').Readable;
const Sqlite3 = require('better-sqlite3');
const logger = require('pelias-logger').get('whosonfirst:sqliteStream');

// attempt to create index to improve read performance
//
// catch all failures since the PIP service will have several processes all
// trying to acquire a write lock on the DB, and only one will succeed
//
// note: can be removed once the upstream PR is merged and all data on
// dist.whosonfirst.org is updated:
// https://github.com/whosonfirst/go-whosonfirst-sqlite-features/pull/4
function createIndex(dbPath) {
  try {
    new Sqlite3(dbPath)
      .exec('CREATE INDEX IF NOT EXISTS spr_obsolete ON spr (is_deprecated, is_superseded)')
      .close();
  } catch (e){
  }
}

class SQLiteStream extends Readable {
  constructor(dbPath, sql) {
    super({ objectMode: true, autoDestroy: true, highWaterMark: 32 });

    createIndex(dbPath);

    this._db = new Sqlite3(dbPath, { readonly: true });
    this._iterator = this._db.prepare(sql).iterate();
    this.on('error', (e) => { logger.error(e); });
    this.on('end', () => { this._db.close(); });
  }

  _read() {
    var ok = true;
    while(ok){
      const elt = this._iterator.next();
      if (!elt.done) { ok = this.push(elt.value); }
      else { this.push(null); break; }
    }
  }
}

/**
 * Filter deprecated, superseded and null island objects
 */
function findGeoJSON() {
  return `
SELECT geojson.id, geojson.body
  FROM geojson JOIN spr
  ON geojson.id = spr.id
  WHERE geojson.id != 1
  AND spr.is_deprecated = 0
  AND spr.is_superseded = 0
  AND NOT TRIM( IFNULL(spr.name, '') ) = ''
  AND NOT (
    spr.latitude = 0 AND
    spr.longitude = 0
  )`;
}

/**
 * Add filter and placetypes
 */
function findGeoJSONByPlacetype(placetypes) {
  if(!Array.isArray(placetypes)) {
    placetypes = [ placetypes ];
  }
  return findGeoJSON() + `
      AND
    spr.placetype IN ('${placetypes.join('\',\'')}')`;
}


module.exports = SQLiteStream;
module.exports.findGeoJSON = findGeoJSON;
module.exports.findGeoJSONByPlacetype = findGeoJSONByPlacetype;
