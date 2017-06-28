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

function getParents(params, callback) {
  console.log('Getting parent ids');

  // get info for place so we can see the parent hierarchy
  getPlaceByIds(params.apiKey, [params.placeId], 'json', (err, res) => {
    if (err) {
      return callback(err);
    }
    const place = res[0];

    // collect all the parent hierarchy ids into one array
    let parentIds = place['wof:hierarchy'].map(_.values)[0];

    //console.log('parent ids:', parentIds);

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

function generateMetafiles(params, callback) {
  console.log('Generating metafiles');

  streamArray(PLACETYPES)
    .pipe(parallelStream(1, (placetype, enc, next) => {

      const metaFile = `${params.targetDir}/meta/wof-${placetype}-latest.csv`;

      // if there are no records in this placetype, generate an empty meta file
      if (!params.places[placetype] || params.places[placetype].length < 1) {

        const metaHeader = 'bbox,cessation,country_id,deprecated,file_hash,' +
          'fullname,geom_hash,geom_latitude,geom_longitude,id,inception,iso,' +
          'iso_country,lastmodified,lbl_latitude,lbl_longitude,locality_id,' +
          'name,parent_id,path,placetype,region_id,source,superseded_by,' +
          'supersedes,wof_country';
        fs.outputFile(metaFile, metaHeader, next);
        return;
      }

      getPlaceByIds(params.apiKey, _.map(params.places[placetype], 'wof:id'), 'meta', (err, places) => {
        if (err) {
          return onError('failed to get meta data for ' + placetype, err, next);
        }

        fs.outputFile(metaFile, places, next);
      });
    },
    (err) => {
      if (err) {
        return onError('failed to get all descendants', err, callback);
      }
      callback();
    }));
}

function getDescendants(params, callback) {
  console.log('Getting descendants');

  streamArray(PLACETYPES)
    .pipe(parallelStream(1, (placetype, enc, next) => {
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
  //console.log(id, placetype);
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
      extras: [
        'bbox',
        'geom:',
        'edtf:',
        'iso',
        'iso:',
        'wof:',
        'lbl:',
        'src:'
      ].join(',')
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
          //console.log(`appending ${response.places.length} descendants to ${placetype}`);
        } else {
          console.log('something is wrong', response);
          keepGoing = false;
          return callback(new Error(JSON.stringify(response, null, 2)));
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

module.exports.generateMetafiles = generateMetafiles;
module.exports.downloadPlaces = downloadPlaces;
module.exports.getParents = getParents;
module.exports.getDescendants = getDescendants;

