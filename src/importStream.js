var spy_stream = require('through2-spy');
var _ = require('lodash');

var peliasLogger = require( 'pelias-logger' );

function fullImport(wofRecordStream, documentGenerator, destination_pipe, callback) {
  var logger = peliasLogger.get( 'whosonfirst', {
    transports: [
      new peliasLogger.winston.transports.File( {
        filename: 'missing_countries.txt',
        timestamp: false
      })
    ]
  });

  var has_country_validation_stream = spy_stream.obj(function(wofDoc) {
    if (_.isUndefined(wofDoc.getAdmin('admin0'))) {
      logger.warn(wofDoc.getId());
    }
  });

  wofRecordStream
    .pipe(documentGenerator)
    .pipe(has_country_validation_stream)
    .pipe(destination_pipe)
    .on('finish', callback);

}

module.exports = fullImport;
