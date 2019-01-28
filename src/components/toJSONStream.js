const parallelTransform = require('parallel-transform');
const logger = require( 'pelias-logger' ).get( 'whosonfirst' );

const maxInFlight = 10;

module.exports.create = () => {
  return parallelTransform(maxInFlight, function(record, next) {
    try {
      next(null, JSON.parse(record.body));
    } catch (parse_err) {
      // By-pass this malformed entry
      logger.warn(`exception parsing JSON for id ${record.id}: ${parse_err}`);
      next();
    }
  });
};