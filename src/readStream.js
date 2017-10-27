var combinedStream = require('combined-stream');
var fs = require('fs');
var through2 = require('through2');
var path = require('path');
var sink = require("through2-sink")

const logger = require( 'pelias-logger' ).get( 'whosonfirst' );

const parseMetaFiles = require('./components/parseMetaFiles');
const isNotNullIslandRelated = require('./components/isNotNullIslandRelated');
const loadJSON = require('./components/loadJSON');
const recordHasIdAndProperties = require('./components/recordHasIdAndProperties');
const isActiveRecord = require('./components/isActiveRecord');
const extractFields = require('./components/extractFields');
const recordHasName = require('./components/recordHasName');
const heapdump = require('heapdump');

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

      if (['wof-postalcode-ga-latest.csv', 'wof-neighbourhood-latest.csv', 'wof-postalcode-gb-latest.csv', 'wof-ocean-latest.csv', 'wof-macrocounty-latest.csv', 'wof-postalcode-ca-latest.csv'].includes(path.basename(metaFilePath))) {
        heapdump.writeSnapshot(function(err, filename) {
          console.log('dump written to', filename);
        });
      }

      next(createOneMetaRecordStream(metaFilePath));
    });
  });

  return metaRecordStream;
}

/*
  This function creates a stream that processes files in `meta/`:
  CSV parses them, extracts the required fields, stores only admin records for
  later, and passes all records on for further processing
*/
function createReadStream(wofConfig, types, wofAdminRecords) {
  const wofRoot = wofConfig.datapath;
  const metaFilePaths = getMetaFilePaths(wofRoot, types);

  return createMetaRecordStream(metaFilePaths, types)
  //.pipe(isNotNullIslandRelated.create())
  .pipe(loadJSON.create(wofRoot, wofConfig.missingFilesAreFatal))
  //.pipe(recordHasIdAndProperties.create())
  //.pipe(isActiveRecord.create())
  //.pipe(extractFields.create())
  //.pipe(recordHasName.create())
  //.pipe(through2.obj(function(wofRecord, enc, callback) {
    //// store admin records in memory to traverse the heirarchy
    //if (wofRecord.place_type !== 'venue' && wofRecord.place_type !== 'postalcode') {
      //wofAdminRecords[wofRecord.id] = wofRecord;
    //}

    //callback(null, wofRecord);
  //}));
  .pipe(sink.obj(() => {}));
}

module.exports = {
  create: createReadStream
};
