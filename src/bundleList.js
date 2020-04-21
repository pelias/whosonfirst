const fs = require('fs-extra');
const path = require('path');
const _ = require('lodash');

const peliasConfig = require( 'pelias-config' ).generate(require('../schema'));

// the importer depends on hierarchy bundles being imported in highest to
// lowest level order. See https://github.com/whosonfirst/whosonfirst-placetypes
// for info on what each bundle type means
//
// venue bundle data has to be imported only after all hierarchy bundles are done
//
// downloading can be done in any order, but the same order might as well be used
const hierarchyRoles = [
  'ocean',
  'marinearea',
  'continent',
  'empire',
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

const SQLITE_REGEX = /whosonfirst-data-[a-z0-9-]+\.db$/;

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

function getDBList(callback) {
  const databasesPath = path.join(peliasConfig.imports.whosonfirst.datapath, 'sqlite');
  //ensure required directory structure exists
  fs.ensureDirSync(databasesPath);
  const dbList = fs.readdirSync(databasesPath).filter(d => SQLITE_REGEX.test(d));

  if (_.isEmpty(dbList)) {
    return callback(`No database found in ${databasesPath}`);
  }
  callback(null, dbList);
}

function getList(callback) {
  if (peliasConfig.imports.whosonfirst.sqlite) {
    return getDBList(callback);
  }
  callback('Bundles no more supported');
}

module.exports.getPlacetypes = getPlacetypes;
module.exports.generateBundleList = getList;
