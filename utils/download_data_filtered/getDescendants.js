
const RateLimiter = require('request-rate-limiter');
const async = require('async');
const logger = require('pelias-logger').get('download_data_filtered');
const parallelStream = require('pelias-parallel-stream');
const streamArray = require('stream-array');
const addToPlacesByPlacetype = require('./getPlaceInfo').addToPlacesByPlacetype;


const PLACETYPES = require('../../src/bundleList').getPlacetypes();

const limiter = new RateLimiter({
  rate: 6,
  interval: 1,
  backoffCode: 429,
  backoffTime: 1
});

const maxInFlight = 1;

const _defaultApiHost = 'https://whosonfirst-api.mapzen.com/';

function getDescendants(params, callback) {
  logger.info('Getting descendants');

  streamArray(PLACETYPES)
    .pipe(parallelStream(maxInFlight, (placetype, enc, next) => {
      getDescendantsByPlacetype(params.apiKey, params.placeId, placetype, (err, places) => {
        if (err) {
          return onError('failed to get descendants for ' + placetype, err, next);
        }

        addToPlacesByPlacetype(placetype, places, params.places);

        next();
      });
    },
    (err) => {
      if (err) {
        return onError('failed to get all descendants', err, callback);
      }
      callback();
    }));
}

function getDescendantsByPlacetype(apiKey, id, placetype, callback) {

  let descendants = [];

  const reqOptions = {
    url: _defaultApiHost,
    method: 'GET',
    qs: {
      method: 'whosonfirst.places.getDescendants',
      api_key: apiKey,
      id: id,
      placetype: placetype,
      per_page: 500,
      extras: 'wof:'
    }
  };

  let keepGoing = true;

  async.whilst(
    () => {
      return keepGoing;
    },
    (callback) => {
      limiter.request(reqOptions, (err, res) => {
        let response;

        try {
          response = JSON.parse(res.body);
        }
        catch (e) {
          return onError(`failed to parse JSON: ${res.body}`, e, callback);
        }

        if (response.places) {
          descendants = descendants.concat(response.places);
          logger.debug(`appending ${response.places.length} descendants to ${placetype}`);
        } else {
          keepGoing = false;
          return onError(`something is wrong: ${response}`, new Error(response), callback);
        }

        if (response.stat === 'ok' && response.cursor) {
          reqOptions.qs.cursor = response.cursor;
        }
        else {
          keepGoing = false;
        }

        callback(null, response);
      });
    },
    // finally callback triggered on error or when the process is finished
    (err) => {
      if (err) {
        return onError('failed to get all descendants', err, callback);
      }
      callback(null, descendants);
    });
}

function onError(error, message, callback) {
  logger.error(message, error);
  if (typeof callback === 'function') {
    callback(error);
  }
}

module.exports.getDescendants = getDescendants;

