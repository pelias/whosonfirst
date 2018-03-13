
const RateLimiter = require('request-rate-limiter');
const logger = require('pelias-logger').get('download_data_filtered');

const limiter = new RateLimiter({
  rate: 6,
  interval: 1,
  backoffCode: 429,
  backoffTime: 1
});

const _defaultApiHost = 'https://whosonfirst-api.mapzen.com/';

function getPlaceByIds(apiKey, ids, format, callback) {

  const reqOptions = {
    url: _defaultApiHost,
    method: 'GET',
    qs: {
      method: 'whosonfirst.places.getInfoMulti',
      api_key: apiKey,
      ids: ids.join(','),
      format: format,
      extras: [
        'id',
        'iso',
        'bbox',
        'wof:',
        'geom:',
        'edtf:',
        'iso:',
        'lbl:'
      ].join(',')
    }
  };
  limiter.request(reqOptions, (err, res) => {
    if (err || res.statusCode !== 200) {
      return onError('failed to get place info', err || res.statusCode, callback);
    }

    let response = res.body;

    if (format === 'json') {
      try {
        response = JSON.parse(res.body);
      }
      catch (e) {
        return onError(`failed to parse JSON: ${res.body}`, e, callback);
      }

      if (response.error || !response.places || response.stat !== 'ok') {
        return onError('failed to get place info', new Error(err || JSON.stringify(response, null, 2)), callback);
      }

      response = response.places;
    }

    callback(null, response);
  });
}

function addToPlacesByPlacetype(placetype, place, places) {
  places[placetype] = places[placetype] || [];
  places[placetype] = places[placetype].concat(place);
}

function onError(error, message, callback) {
  logger.error(message, error.message);
  if (typeof callback === 'function') {
    callback(error);
  }
}

module.exports = {
  getPlaceByIds: getPlaceByIds,
  addToPlacesByPlacetype: addToPlacesByPlacetype
};

