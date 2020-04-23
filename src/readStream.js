const combinedStream = require('combined-stream');
const through2 = require('through2');
const path = require('path');

const logger = require( 'pelias-logger' ).get( 'whosonfirst' );

const getPlacetypes = require('./bundleList').getPlacetypes;
const recordHasIdAndProperties = require('./components/recordHasIdAndProperties');
const isActiveRecord = require('./components/isActiveRecord');
const extractFields = require('./components/extractFields');
const recordHasName = require('./components/recordHasName');
const SQLiteStream = require('./components/sqliteStream');
const toJSONStream = require('./components/toJSONStream');

/*
 * Convert a base directory and list of databases names into a list of sqlite file paths
 */
function getSqliteFilePaths(wofRoot, databases) {
  return databases.map((database) => {
    return path.join(wofRoot, 'sqlite', database);
  });
}

/*
 * given a list of databases file paths, create a combined stream that reads all the
 * records via the SQLite reader stream
 */
function createSQLiteRecordStream(dbPaths, importPlace) {
  const sqliteStream = combinedStream.create();
  dbPaths.forEach((dbPath) => {
    getPlacetypes().forEach(placetype => {
      sqliteStream.append( (next) => {
        logger.debug( `Loading '${placetype}' of ${path.basename(dbPath)} database from ${path.dirname(dbPath)}` );
        const sqliteStatement = importPlace ?
          SQLiteStream.findGeoJSONByPlacetypeAndWOFId(placetype, importPlace) :
          SQLiteStream.findGeoJSONByPlacetype(placetype);
        next(new SQLiteStream(dbPath, sqliteStatement));
      });
    });
  });

  return sqliteStream;
}

/*
  This function creates a stream that processes files in `sqlite/`:
  It will load all geojson in all sqlite in the folder
*/
function createReadStream(wofConfig, types, wofAdminRecords) {
  const wofRoot = wofConfig.datapath;

  return createSQLiteRecordStream(getSqliteFilePaths(wofRoot, types), wofConfig.importPlace)
  .pipe(toJSONStream.create())
  .pipe(recordHasIdAndProperties.create())
  .pipe(isActiveRecord.create())
  .pipe(extractFields.create())
  .pipe(recordHasName.create())
  .pipe(through2.obj(function(wofRecord, enc, callback) {
    // store admin records in memory to traverse the heirarchy
    if (wofRecord.place_type !== 'venue' && wofRecord.place_type !== 'postalcode') {
      wofAdminRecords[wofRecord.id] = wofRecord;
    }

    callback(null, wofRecord);
  }));
}

module.exports = {
  create: createReadStream
};
