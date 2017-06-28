'use strict';

const child_process = require('child_process');
const path = require('path');
const fs = require('fs-extra');
const async = require('async');
const logger = require('pelias-logger').get('download_data_filtered');
const parallelStream = require('pelias-parallel-stream');
const streamArray = require('stream-array');
const os = require('os');

const maxInFlight = os.cpus().length * 10;

const _defaultHost = 'https://whosonfirst.mapzen.com';

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
    logger.info(`downloading ${placetype}`);

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
    return onError(`Invalid ID: ${placeId}`, new Error(`Invalid ID`), callback);
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

  fs.ensureDir(targetDirFull, (error) => {
    if (error) {
      return onError(error, `error making directory ${targetDirFull}`, callback);
    }

    const cmd = `curl -o ${path.join(targetDirFull, filename)} ${sourceUrl}`;

    child_process.exec(cmd, (error) => {
      if (error) {
        return onError(error, `error downloading ${sourceUrl}`, callback);
      }

      logger.debug(`done downloading ${sourceUrl}`);
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

module.exports.downloadPlaces = downloadPlaces;

