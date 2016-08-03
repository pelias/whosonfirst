var combinedStream = require('combined-stream');
var parse = require('csv-parse');
var fs = require('fs');
var through2 = require('through2');

var logger = require( 'pelias-logger' ).get( 'whosonfirst' );

var isValidId = require('./components/isValidId');
var fileIsReadable = require('./components/fileIsReadable');
var loadJSON = require('./components/loadJSON');
var recordHasIdAndProperties = require('./components/recordHasIdAndProperties');
var isActiveRecord = require('./components/isActiveRecord');
var extractFields = require('./components/extractFields');
var recordHasName = require('./components/recordHasName');

/*
 * Convert a base directory and list of types into a list of meta file paths
 */
function getMetaFilePaths(directory, types) {
  return types.map(function(type) {
    return directory + 'meta/wof-' + type + '-latest.csv';
  });
}

/*
 * Given the path to a meta CSV file, return a stream of the individual records
 * within that CSV file.
 */
function createOneMetaRecordStream(metaFilePath) {
  return fs.createReadStream(metaFilePath)
    .pipe(parse({ delimiter: ',', columns: true }));
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
function createReadStream(directory, types, wofAdminRecords) {
  var metaFilePaths = getMetaFilePaths(directory, types);

  return createMetaRecordStream(metaFilePaths, types)
  .pipe(isValidId.create())
  .pipe(fileIsReadable.create(directory + 'data/'))
  .pipe(loadJSON.create(directory + 'data/'))
  .pipe(recordHasIdAndProperties.create())
  .pipe(isActiveRecord.create())
  .pipe(extractFields.create())
  .pipe(recordHasName.create())
  .pipe(through2.obj(function(wofRecord, enc, callback) {
    // store admin records in memory to traverse the heirarchy
    if (wofRecord.place_type !== 'venue') {
      wofAdminRecords[wofRecord.id] = wofRecord;
    }

    callback(null, wofRecord);
  }));
}

module.exports = {
  create: createReadStream
};
