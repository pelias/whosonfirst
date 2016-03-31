var parse = require('csv-parse');
var fs = require('fs');
var batch = require('batchflow');
var sink = require('through2-sink');

var calculateFilePath = require('./components/calculateFilePath');
var filterOutUnreadableFiles = require('./components/filterOutUnreadableFiles');
var loadJSON = require('./components/loadJSON');
var filterOutIncompleteRecords = require('./components/filterOutIncompleteRecords');
var filterOutDeprecatedRecords = require('./components/filterOutDeprecatedRecords');
var extractFields = require('./components/extractFields');
var filterOutNamelessRecords = require('./components/filterOutNamelessRecords');

/*
  This function finds all the `latest` files in `meta/`, CSV parses them,
  extracts the required fields, and assigns to a big collection
*/
function readData(directory, types, wofRecords, callback) {
  batch(types).parallel(2).each(function(idx, type, done) {
    fs.createReadStream(directory + 'meta/wof-' + type + '-latest.csv')
      .pipe(parse({ delimiter: ',', columns: true }))
      .pipe(calculateFilePath.create())
      .pipe(filterOutUnreadableFiles.create(directory + 'data/'))
      .pipe(loadJSON.create(directory + 'data/'))
      .pipe(filterOutIncompleteRecords.create())
      .pipe(filterOutDeprecatedRecords.create())
      .pipe(extractFields.create())
      .pipe(filterOutNamelessRecords.create())
      .pipe(sink.obj(function(wofRecord) {
        wofRecords[wofRecord.id] = wofRecord;
      }))
      .on('finish', done);

  }).error(function(err) {
    console.error(err);
  }).end(function() {
    callback();
  });

}

module.exports = readData;
