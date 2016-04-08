var parse = require('csv-parse');
var fs = require('fs');
var batch = require('batchflow');
var sink = require('through2-sink');

var isValidId = require('./components/isValidId');
var fileIsReadable = require('./components/fileIsReadable');
var loadJSON = require('./components/loadJSON');
var recordHasIdAndProperties = require('./components/recordHasIdAndProperties');
var isActiveRecord = require('./components/isActiveRecord');
var extractFields = require('./components/extractFields');
var recordHasName = require('./components/recordHasName');

/*
  This function finds all the `latest` files in `meta/`, CSV parses them,
  extracts the required fields, and assigns to a big collection
*/
function readData(directory, types, wofRecords, callback) {
  batch(types).parallel(2).each(function(idx, type, done) {
    fs.createReadStream(directory + 'meta/wof-' + type + '-latest.csv')
      .pipe(parse({ delimiter: ',', columns: true }))
      .pipe(isValidId.create())
      .pipe(fileIsReadable.create(directory + 'data/'))
      .pipe(loadJSON.create(directory + 'data/'))
      .pipe(recordHasIdAndProperties.create())
      .pipe(isActiveRecord.create())
      .pipe(extractFields.create())
      .pipe(recordHasName.create())
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
