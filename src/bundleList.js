'use strict';

const readline = require('readline');
const fs = require('fs-extra');
const path = require('path');
const downloadFileSync = require('download-file-sync');
const _ = require('lodash');
const klawSync = require('klaw-sync');

const peliasConfig = require( 'pelias-config' ).generate(require('../schema'));

// the importer depends on hierarchy bundles being imported in highest to
// lowest level order. See https://github.com/whosonfirst/whosonfirst-placetypes
// for info on what each bundle type means
//
// venue bundle data has to be imported only after all hierarchy bundles are done
//
// downloading can be done in any order, but the same order might as well be used
const hierarchyRoles = [
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
  'macrohood',
  'neighbourhood'
];

const postalcodeRoles = [
  'postalcode'
];

const venueRoles = [
  'venue'
];

// the bundle index contains timestamped bundles and non tar.bz2 files.
// this regex is used to filter the bundle list, removing invalid entries.
// see: https://whosonfirst.mapzen.com/bundles/index.txt
const validBundleRegex = /-latest-bundle\.tar\.bz2$/;

function getPlacetypes() {
  let roles = hierarchyRoles;

  // admin-only env var should override the config setting since the hierarchy bundles are useful
  // on their own to allow other importers to start when using admin lookup
  if (peliasConfig.imports.whosonfirst.importVenues && process.argv[2] !== '--admin-only') {
    roles = roles.concat(venueRoles);
  }

  if (peliasConfig.imports.whosonfirst.importPostalcodes && process.argv[2] !== '--admin-only') {
    roles = roles.concat(postalcodeRoles);
  }

  return roles;
}

function ensureBundleIndexExists(metaDataPath) {
  const bundleIndexFile = path.join(metaDataPath, 'whosonfirst_bundle_index.txt');
  const bundleIndexUrl = 'https://whosonfirst.mapzen.com/bundles/index.txt';

  //ensure required directory structure exists
  fs.ensureDirSync(metaDataPath);

  if (!fs.existsSync(bundleIndexFile)) {

    const klawOptions = {
      nodir: true,
      filter: (f) => (f.path.indexOf('-latest.csv') !== -1)
    };
    const metaFiles = _.map(klawSync(metaDataPath, klawOptions),
      (f) => (path.basename(f.path)));

    // if there are no existing meta files and the bundle index file is not found,
    // download bundle index
    if (_.isEmpty(metaFiles)) {
      fs.writeFileSync(bundleIndexFile, downloadFileSync(bundleIndexUrl));
    }
    else {
      fs.writeFileSync(bundleIndexFile, metaFiles.join('\n'));
    }
  }
}

function getBundleList(callback) {
  const metaDataPath = path.join(peliasConfig.imports.whosonfirst.datapath, 'meta');
  const bundleIndexFile = path.join(metaDataPath, 'whosonfirst_bundle_index.txt');

  ensureBundleIndexExists(metaDataPath);

  const roles = getPlacetypes();

  // the order in which the bundles are listed is critical to the correct execution
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

      // skip invalid bundle names
      if( !validBundleRegex.test( bundle ) ){
        console.error( 'info: invalid bundle name skipped', bundle );
        return;
      }

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

module.exports.getPlacetypes = getPlacetypes;
module.exports.generateBundleList = getBundleList;
