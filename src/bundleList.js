'use strict';

const readline = require('readline');
const fs = require('fs-extra');
const path = require('path');
const downloadFileSync = require('download-file-sync');
const _ = require('lodash');

const peliasConfig = require('pelias-config').generate();

// validate the WOF importer configuration before continuing
require('./configValidation').validate(peliasConfig.imports.whosonfirst);

const metaDataPath = peliasConfig.imports.whosonfirst.datapath + '/meta';
const bundleIndexFile = path.join(metaDataPath, 'whosonfirst_bundle_index.txt');
const bundleIndexUrl = 'https://whosonfirst.mapzen.com/bundles/index.txt';

//ensure required directory structure exists
fs.ensureDirSync(metaDataPath);

// if the bundle index file is not found, download it
if (!fs.existsSync(bundleIndexFile)) {
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

  // the order in which the bundles are list is critical to the correct execution
  // of the admin hierarchy lookup code in whosonfirst importer,
  // so in order to preserve the order specified by the roles list
  // we must collect the bundles from the index files by buckets
  // and then at the end merge all the buckets into a single ordered array
  const bundleBuckets = initBundleBuckets(roles);

  const rl = readline.createInterface({
    input: fs.createReadStream(bundleIndexFile)
  });

  rl.on('line', (line) => {

    sortBundleByBuckets(roles, line, bundleBuckets);

  }).on('close', () => {

    const bundles = combineBundleBuckets(roles, bundleBuckets);

    console.log('Generated list of bundles:');
    console.log(bundles);

    callback(null, bundles);

  });
}

function initBundleBuckets(roles) {
  const bundleBuckets = {};
  roles.forEach( (role) => {
    bundleBuckets[role] = [];
  });
  return bundleBuckets;
}

function sortBundleByBuckets(roles, bundle, bundleBuckets) {
  roles.forEach((role) => {
    if (bundle.indexOf('-' + role + '-') !== -1) {
      bundleBuckets[role].push(bundle);
    }
  });
}

function combineBundleBuckets(roles, bundleBuckets) {
  let bundles = [];

  roles.forEach( (role) => {
    bundles = _.concat(bundles, _.get(bundleBuckets, role, []));
  });

  return bundles;
}

module.exports.generateBundleList = getBundleList;
