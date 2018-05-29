const path = require('path');
const fs = require('fs');
const parallelTransform = require('parallel-transform');
const wofIdToPath = require('../wofIdToPath');

const maxInFlight = 10;

const logger = require( 'pelias-logger' ).get( 'whosonfirst' );

module.exports.create = function create(wofRoot, missingFilesAreFatal) {
  return parallelTransform(maxInFlight, function(record, next) {

    if (!record.path || record.path === 'path') {
      // we can generate the record path if column not present in metadata
      record.path = wofIdToPath(record.id).concat(record.id+'.geojson').join(path.sep);

      // failed to infer the data disk path
      if(!path.length){
        logger.warn('WOF record has no path', record);
        return next();
      }
    }

    const full_file_path = path.join(wofRoot, 'data', record.path);

    fs.readFile(full_file_path, (err, data) => {
      if (err) {
        logger.error(err.message);

        // only forward the error is missing files should be fatal
        return next(missingFilesAreFatal ? err : null);

      }

      try {
        next(null, JSON.parse(data));

      } catch (parse_err) {
        logger.error(`exception parsing JSON for id ${record.id} in file ${record.path}: ${parse_err}`);
        next(parse_err);

      }

    });

  });
};
