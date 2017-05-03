var combinedStream = require('combined-stream');
var fs = require('fs');
var through2 = require('through2');
var path = require('path');

var logger = require( 'pelias-logger' ).get( 'whosonfirst' );

const parseMetaFiles = require('./components/parseMetaFiles');
var isValidId = require('./components/isValidId');
var loadJSON = require('./components/loadJSON');
var recordHasIdAndProperties = require('./components/recordHasIdAndProperties');
var isActiveRecord = require('./components/isActiveRecord');
var extractFields = require('./components/extractFields');
var recordHasName = require('./components/recordHasName');
var notVisitingNullIsland = require('./components/recordNotVisitingNullIsland');

/*
 * Convert a base directory and list of types into a list of meta file paths
 */
function getMetaFilePaths(wofRoot, bundles) {
  return bundles.map((bundle) => {
    return path.join(wofRoot, 'meta', bundle);
  });
}

/*
 * Given the path to a meta CSV file, return a stream of the individual records
 * within that CSV file.
 */
function createOneMetaRecordStream(metaFilePath) {

  // All of these arguments are optional.
  var options = {
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
  var metaRecordStream = combinedStream.create();

  metaFilePaths.forEach(function appendToCombinedStream(metaFilePath, idx) {
    var type = types[idx];
    metaRecordStream.append( function ( next ){
      logger.info( 'Loading ' + type + ' records from ' + metaFilePath );
      next(createOneMetaRecordStream(metaFilePath));
    });
  });

  return metaRecordStream;
}

/*
  This function creates a steram that finds all the `latest` files in `meta/`,
  CSV parses them, extracts the required fields, stores only admin records for
  later, and passes all records on for further processing
*/
function createReadStream(wofRoot, types, wofAdminRecords) {
  var metaFilePaths = getMetaFilePaths(wofRoot, types);

  return createMetaRecordStream(metaFilePaths, types)
  .pipe(isValidId.create())
  .pipe(loadJSON.create(wofRoot))
  .pipe(recordHasIdAndProperties.create())
  .pipe(isActiveRecord.create())
  .pipe(extractFields.create())
  .pipe(notVisitingNullIsland.create())
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
