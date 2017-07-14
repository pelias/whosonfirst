'use strict';

const child_process = require('child_process');
const _ = require('lodash');
const logger = require('pelias-logger').get('download_data_filtered');
const getPlaceByIds = require('./getPlaceInfo').getPlaceByIds;
const addToPlacesByPlacetype = require('./getPlaceInfo').addToPlacesByPlacetype;


function getParents(params, callback) {
  logger.info('Getting parent ids');

  // get info for place so we can see the parent hierarchy
  getPlaceByIds(params.apiKey, [params.placeId], 'json', (err, res) => {
    if (err) {
      return callback(err);
    }
    const place = res[0];

    // collect all the parent hierarchy ids into one array
    let parentIds = place['wof:hierarchy'].map(_.values)[0];

    logger.debug('parent ids:', parentIds);

    // use the parent id list to get info from WOF api
    getPlaceByIds(params.apiKey, parentIds, 'json', (err, parentPlaces) => {
      if (err) {
        return onError('Failed to get parent infos', err, callback);
      }

      _.each(parentPlaces, (parent) => { addToPlacesByPlacetype(parent['wof:placetype'], parent, params.places); });
      callback();
    });
  });
}

function onError(error, message, callback) {
  logger.error(message, error.message);
  if (typeof callback === 'function') {
    callback(error);
  }
}

module.exports.getParents = getParents;

