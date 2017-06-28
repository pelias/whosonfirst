'use strict';

const RateLimiter = require('request-rate-limiter');
const child_process = require('child_process');
const path = require('path');
const fs = require('fs-extra');
const async = require('async');
const _ = require('lodash');
const parallelStream = require('pelias-parallel-stream');
const streamArray = require('stream-array');
const os = require('os');

const PLACETYPES = require('../../src/bundleList').getPlacetypes();

const limiter = new RateLimiter({
  rate: 6,
  interval: 1,
  backoffCode: 429,
  backoffTime: 1
});

const maxInFlight = os.cpus().length * 10;

const _defaultHost = 'https://whosonfirst.mapzen.com';
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
    if (err) {
      return onError('failed to get place info', err, callback);
    }

    let response = res.body;

    if (format === 'json') {
      try {
        response = JSON.parse(res.body);
      }
      catch (e) {
        return onError(`failed to parse JSON: ${res.body}`, e, callback);
      }

      if (response.error || !response.places) {
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

/**
 * Download all records list in idsByPlacetype object to target directory.
 * Proper WOF directory structure will be created.
 *
 * @param {string} params.targetDir
 * @param {object} params.places
 *  {
 *    region: [ array of ids ],
 *    locality: [ array of ids ]
 *    ... other placetypes
 *  }
 * @param {function} callback (err)
 */
function downloadPlaces(params, callback) {
  const targetDir = params.targetDir;
  const placesByPlacetype = params.places;

  const _download = (places, placetype, placetypeCallback) => {
    console.log(`downloading ${placetype}`);

    const parallelDownloadStream = parallelStream(
      maxInFlight,
      (place, enc, next) => {
        downloadById({ targetDir: `${targetDir}/data`, placeId: place['wof:id'] }, next);
      },
      placetypeCallback);

    streamArray(places).pipe(parallelDownloadStream);
  };

  async.eachOfSeries(placesByPlacetype, _download, callback);
}

//Retrieve full WOF record given the WOF id.
function downloadById(params, callback) {
  const targetDir = params.targetDir;
  const placeId = params.placeId;

  if (!placeId) {
    console.log(`Invalid ID: ${placeId}`);
    return callback(new Error(`Invalid ID`));
  }

  let strId = placeId.toString();
  let subPath = [];

  while (strId.length){
    let part = strId.substr(0, 3);
    subPath.push(part);
    strId = strId.substr(3);
  }

  const filename = `${placeId}.geojson`;
  const sourceUrl = `${_defaultHost}/data/${subPath.join('/')}/${filename}`;
  const targetDirFull = path.join(targetDir, subPath.join(path.sep));

  // console.log('sourceUrl', sourceUrl);
  // console.log('targetPath', targetDirFull);

  fs.ensureDir(targetDirFull, (error) => {
    if (error) {
      return onError(error, `error making directory ${targetDirFull}`, callback);
    }

    const cmd = `wget -O ${path.join(targetDirFull, filename)} ${sourceUrl}`;

    child_process.exec(cmd, (error) => {
      if (error) {
        return onError(error, `error downloading ${sourceUrl}`, callback);
      }

      //console.log(`done downloading ${sourceUrl}`);
      callback();
    });
  });
}

function onError(error, message, callback) {
  console.error(message, error.message);
  if (typeof callback === 'function') {
    callback(error);
  }
}

module.exports = {
  getPlaceByIds: getPlaceByIds,
  addToPlacesByPlacetype: addToPlacesByPlacetype,
  downloadPlaces: downloadPlaces,
  getParents: getParents
};

