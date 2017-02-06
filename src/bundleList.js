'use strict';

const readline = require('readline');
const fs = require('fs-extra');
const path = require('path');
const downloadFileSync = require('download-file-sync');

const peliasConfig = require('pelias-config').generate();

// validate the WOF importer configuration before continuing
require('./configValidation').validate(peliasConfig.imports.whosonfirst);

const metaDataPath = peliasConfig.imports.whosonfirst.datapath + '/meta';
const bundleIndexFile = path.join(metaDataPath, 'whosonfirst_bundle_index.txt');
const bundleIndexUrl = 'https://whosonfirst.mapzen.com/bundles/index.txt';

//ensure required directory structure exists
fs.ensureDirSync(metaDataPath);

// if the bundle index file is not found, download it
if (!fs.exists(bundleIndexFile)) {
  fs.writeFileSync(bundleIndexFile, downloadFileSync(bundleIndexUrl));
}


// the importer depends on hierarchy bundles being imported in highest to
// lowest level order. See https://github.com/whosonfirst/whosonfirst-placetypes
// for info on what each bundle type means
//
// venue bundle data has to be imported only after all hierarchy bundles are done
// 
// downloading can be done in any order, but the same order might as well be used
var hierarchyRoles = [
  'continent',
  'country',
  'dependency',
  'disputed',
  'macroregion',
  'region',
  'macrocounty',
  'county',
  'localadmin',
  'locality',
  'borough',
  'neighbourhood',
  'postalcode'
];

var venueRoles = [
  'venue'
];

function getBundleList(callback) {

  let roles = hierarchyRoles;

  // admin-only env var should override the config setting since the hierarchy bundles are useful
  // on their own to allow other importers to start when using admin lookup
  if (peliasConfig.imports.whosonfirst.importVenues && process.argv[2] !== '--admin-only') {
    roles = roles.concat(venueRoles);
  }

  const bundles = [];

  const rl = readline.createInterface({
    input: fs.createReadStream(bundleIndexFile)
  });

  rl.on('line', (line) => {
    roles.forEach((role) => {
      if (line.indexOf(role) !== -1) {
        bundles.push(line);
      }
    });
  }).on('close', () => {
    callback(null, bundles);
  });
}

module.exports.generateBundleList = getBundleList;
