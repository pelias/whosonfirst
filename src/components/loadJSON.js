const path = require('path');
const fs = require('fs');
const parallelStream = require('pelias-parallel-stream');
const through = require('through2');
const concurrent = require('through2-concurrent');
const transform = require('parallel-transform');

const maxInFlight = 1;

const logger = require( 'pelias-logger' ).get( 'whosonfirst' );

module.exports.create = function create(wofRoot, missingFilesAreFatal) {
  return transform(3, function(record, next) {
    if (!record.path || record.path === 'path') {
      logger.warn('WOF record has no path', record);
      return next();
    }

    const full_file_path = path.join(wofRoot, 'data', record.path);
    const partial_path = record.path;
    const id = record.id;
    delete record;

    fs.readFile(full_file_path, (err, data) => {
      if (err) {
        logger.error(err.message);

        // only forward the error if missing files should be fatal
        return next(missingFilesAreFatal ? err : null);
      }


      let parsed_data;
      try {
        parsed_data = JSON.parse(data);
      } catch (parse_err) {
        logger.error(`exception parsing JSON for id ${id} in file ${partial_path}: ${parse_err}`);
        next(parse_err);
      }
      next(null, parsed_data);
    });
  });
};
