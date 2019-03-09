const Readable = require('stream').Readable;
const Sqlite3 = require('better-sqlite3');

class SQLiteStream extends Readable {
  constructor(dbPath, sql) {
    super({ objectMode: true, autoDestroy: true });
    this._db = new Sqlite3(dbPath, { readonly: true });
    this._iterator = this._db.prepare(sql).iterate();
    this.on('end', () => {
      this._db.close();
    });
  }

  _read() {
    const elt = this._iterator.next();
    this.push(!elt.done && elt.value ? elt.value : null);
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
  WHERE
    geojson.id != 1
      AND
    spr.is_deprecated = 0
      AND
    spr.is_superseded = 0
      AND
    spr.name <> ''
      AND
    (spr.latitude != 0 OR spr.longitude != 0)`;
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
function findGeoJSONByPlacetypeAndWOFId(placetypes, wofids) {
  if(!Array.isArray(wofids)) {
    wofids = [ wofids ];
  }
  wofids = wofids.map(id => parseInt(id, 10)).join(',');
  return findGeoJSONByPlacetype(placetypes) + `
      AND
    spr.id IN (
      SELECT DISTINCT id
        FROM ancestors
        WHERE id IN (${wofids})
      UNION SELECT DISTINCT id
        FROM ancestors
        WHERE ancestor_id IN (${wofids})
      UNION SELECT DISTINCT ancestor_id
        FROM ancestors
        WHERE id IN (${wofids})
    )`;
}

module.exports = SQLiteStream;
module.exports.findGeoJSON = findGeoJSON;
module.exports.findGeoJSONByPlacetype = findGeoJSONByPlacetype;
module.exports.findGeoJSONByPlacetypeAndWOFId = findGeoJSONByPlacetypeAndWOFId;