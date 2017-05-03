const path = require('path');
const fs = require('fs');
const parallelStream = require('pelias-parallel-stream');

const maxInFlight = 10;

const logger = require( 'pelias-logger' ).get( 'whosonfirst' );

module.exports.create = function create(wofRoot, missingFilesAreFatal) {
  return parallelStream(maxInFlight, function(record, enc, next) {
    const full_file_path = [ wofRoot, 'data', record.path ].join(path.sep);

    fs.readFile(full_file_path, (err, data) => {
      if (err) {
        logger.error(err.message);

        // only forward the error is missing files should be fatal
        return next(missingFilesAreFatal ? err : null);

      }

      try {
        next(null, JSON.parse(data));

      } catch (parse_err) {
        logger.error(`exception parsing JSON in file ${record.path}: ${parse_err}`);
        logger.error('Inability to parse JSON usually means that Who\'s on First ' +
                      'has been cloned without using git-lfs, please see instructions ' +
                      'here: https://github.com/whosonfirst/whosonfirst-data#git-and-large-files');
        next(parse_err);
        
      }

    });

  });
};
