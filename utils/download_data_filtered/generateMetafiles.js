'use strict';

const fs = require('fs-extra');
const _ = require('lodash');
const logger = require('pelias-logger').get('download_data_filtered');
const parallelStream = require('pelias-parallel-stream');
const streamArray = require('stream-array');
const getPlaceByIds = require('./getPlaceInfo').getPlaceByIds;


const PLACETYPES = require('../../src/bundleList').getPlacetypes();

function generateMetafiles(params, callback) {
  logger.info('Generating metafiles');

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

function onError(error, message, callback) {
  logger.error(`[generateMetafiles] Error: ${message}`, error.message);
  if (typeof callback === 'function') {
    callback(error);
  }
}


module.exports.generateMetafiles = generateMetafiles;

