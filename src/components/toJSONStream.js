const through2 = require('through2');
const logger = require( 'pelias-logger' ).get( 'whosonfirst' );

module.exports.create = () => {
  return through2.obj((record, enc, next) => {
    try {
      next(null, JSON.parse(record.body));
    } catch (parse_err) {
      // By-pass this malformed entry
      logger.warn(`exception parsing JSON for id ${record.id}: ${parse_err}`);
      next();
    }
  });
};