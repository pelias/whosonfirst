var combinedStream = require('combined-stream');
var fs = require('fs');
var through2 = require('through2');
var path = require('path');

const logger = require( 'pelias-logger' ).get( 'whosonfirst' );

const getPlacetypes = require('./bundleList').getPlacetypes;
const parseMetaFiles = require('./components/parseMetaFiles');
const isNotNullIslandRelated = require('./components/isNotNullIslandRelated');
const loadJSON = require('./components/loadJSON');
const recordHasIdAndProperties = require('./components/recordHasIdAndProperties');
const isActiveRecord = require('./components/isActiveRecord');
const extractFields = require('./components/extractFields');
const recordHasName = require('./components/recordHasName');
const SQLiteStream = require('./components/sqliteStream');
const toJSONStream = require('./components/toJSONStream');

/*
 * Convert a base directory and list of types into a list of meta file paths
 */
function getMetaFilePaths(wofRoot, bundles) {
  return bundles.map((bundle) => {
    return path.join(wofRoot, 'meta', bundle);
  });
}

/*
 * Convert a base directory and list of types into a list of sqlite file paths
 */
function getSqliteFilePaths(wofRoot, databases) {
  return databases.map((database) => {
    return path.join(wofRoot, 'sqlite', database);
  });
}

/*
 * Given the path to a meta CSV file, return a stream of the individual records
 * within that CSV file.
 */
function createOneMetaRecordStream(metaFilePath) {
  // All of these arguments are optional.
  const options = {
    escapeChar : '"', // default is an empty string
    enclosedChar : '"' // default is an empty string
  };

  return fs.createReadStream(metaFilePath)
    .pipe(parseMetaFiles.create());
}

/*
 * given a list of meta file paths, create a combined stream that reads all the
 * records via the csv parser
 */
function createMetaRecordStream(metaFilePaths, types) {
  const metaRecordStream = combinedStream.create();

  metaFilePaths.forEach((metaFilePath) => {
    metaRecordStream.append( (next) => {
      logger.info( `Loading ${path.basename(metaFilePath)} records from ${path.dirname(metaFilePath)}` );
      next(createOneMetaRecordStream(metaFilePath));
    });
  });

  return metaRecordStream;
}

/*
 * given a list of databases file paths, create a combined stream that reads all the
 * records via the SQLite reader stream
 */
function createSQLiteRecordStream(dbPaths) {
  const sqliteStream = combinedStream.create();

  dbPaths.forEach((dbPath) => {
    sqliteStream.append( (next) => {
      logger.info( `Loading ${path.basename(dbPath)} records from ${path.dirname(dbPath)}` );
      next(new SQLiteStream(dbPath, SQLiteStream.findGeoJSONByPlacetype(getPlacetypes())));
    });
  });

  return sqliteStream;
}

/*
  This function creates a stream that processes files in `meta/`:
  CSV parses them, extracts the required fields, stores only admin records for
  later, and passes all records on for further processing
*/
function createReadStream(wofConfig, types, wofAdminRecords) {
  const wofRoot = wofConfig.datapath;
  const metaFilePaths = getMetaFilePaths(wofRoot, types);

  // Select correct stream between meta and SQLite based on config and do specialized stuff
  const stream = wofConfig.sqlite ?
    createSQLiteRecordStream(getSqliteFilePaths(wofRoot, types))
      .pipe(toJSONStream.create()) :
    createMetaRecordStream(metaFilePaths, types)
      .pipe(isNotNullIslandRelated.create())
      .pipe(loadJSON.create(wofRoot, wofConfig.missingFilesAreFatal));

  // All the pipeline is the same for both meta and SQLite streams
  return stream
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
