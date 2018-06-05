
const fs = require('fs-extra');
const _ = require('lodash');
const logger = require('pelias-logger').get('download_data_filtered');
const parallelTransform = require('parallel-transform');
const streamArray = require('stream-array');
const getPlaceByIds = require('./getPlaceInfo').getPlaceByIds;
const converter = require('csv-string');
const async = require('async');

const PLACETYPES = require('../../src/bundleList').getPlacetypes();

function generateMetafiles(params, callback) {
  logger.info('Generating metafiles');

  function onFinish(err) {
    if (err) {
      return onError('failed to get all descendants', err, callback);
    }
    logger.info('Finished generating all metafiles');
    callback();
  }

  streamArray(PLACETYPES).pipe(
    parallelTransform(1, generatePlacetypeMetafile.bind(null, params), onFinish));
}

function generatePlacetypeMetafile(params, placetype, next) {

  const context = {
    metaFile: `${params.targetDir}/meta/wof-${placetype}-latest.csv`,
    params: params,
    placetype: placetype
  };

  async.series(
    [
      getPreviousMeta.bind(null, context),
      getCurrentMeta.bind(null, context),
      writeMetafile.bind(null, context)
    ],
    (err) => {
      logger.info(`Finished generating metafile for ${placetype}`, err);
      next(err);
  });
}

function getPreviousMeta(context, callback) {
  fs.pathExists(context.metaFile, (err, exists) => {

    if (err || exists === false) {
      logger.debug('previous file not found', context.metaFile, err, exists);
      context.json = [];
      return callback();
    }

    logger.info('previous meta file found', context.metaFile);

    fs.readFile(context.metaFile, 'utf8', (err, data) => {

      try {
        const json = converter.parse(data);
        context.header = _.slice(json, 0, 1);
        context.json = _.slice(json, 1);
      }
      catch (err) {
        return callback(new Error('failed to parse CSV', data));
      }

      callback();
    });
  });
}

function getCurrentMeta(context, callback) {
  // if there are no records in this placetype, skip this step
  if (!context.params.places[context.placetype] ||
    context.params.places[context.placetype].length < 1) {

    // important to maintain asynchronous processing so callback must happen on next tick
    return process.nextTick(callback);
  }

  // check previous list for new ids to avoid duplicates
  const previousIds = _.map(context.json, (obj) => obj[9]);
  const currentIds = _.map(context.params.places[context.placetype], 'wof:id');

  // exclude all current ids that are already in existing metadata
  const filteredCurrentIds = _.differenceBy(currentIds, previousIds, (obj) => obj.toString());

  if (_.isEmpty(filteredCurrentIds)) {
    logger.info('no new ids found, skipping lookup');
    return process.nextTick(callback);
  }

  let start = 0;
  async.whilst(
    () => { return start < filteredCurrentIds.length; },
    (next) => {
      let batch = _.slice(filteredCurrentIds, start, start+20);
      start += 20;
      getMetaBatch(context, batch, next);
    },
    callback);
}

function getMetaBatch(context, ids, callback) {

  if (ids.length < 1) {
    return process.nextTick(callback);
  }

  getPlaceByIds(context.params.apiKey, ids, 'meta', (err, places) => {
    if (err) {
      return onError('failed to get meta data for ' + context.placetype, err, callback);
    }

    if (_.isEmpty(places.trim())) {
      logger.error('this is weird, we asked for places but got nothing back', ids);
      return callback();
    }

    try {
      const json = converter.parse(places);
      // save the header separately
      context.header = _.slice(json, 0, 1);
      // save the data rows
      context.json = _.concat(context.json, _.slice(json, 1));
    }
    catch (err) {
      return callback(err);
    }

    callback();
  });
}

function writeMetafile(context, callback) {
  // if there are no records in this placetype, generate an empty meta file
  if (_.isEmpty(context.json)) {
    return writeEmptyMetafile(context.metaFile, callback);
  }

  fs.outputFile(
    context.metaFile,
    converter.stringify(_.concat(context.header, context.json)),
    callback
  );
}

function writeEmptyMetafile(metaFile, callback) {
  const metaHeader = 'bbox,cessation,country_id,deprecated,file_hash,' +
    'fullname,geom_hash,geom_latitude,geom_longitude,id,inception,iso,' +
    'iso_country,lastmodified,lbl_latitude,lbl_longitude,locality_id,' +
    'name,parent_id,path,placetype,region_id,source,superseded_by,' +
    'supersedes,wof_country';
  fs.outputFile(metaFile, metaHeader, callback);
}

function onError(error, message, callback) {
  logger.error(`[generateMetafiles] Error: ${message}`, error.message);
  if (typeof callback === 'function') {
    callback(error);
  }
}


module.exports.generateMetafiles = generateMetafiles;

