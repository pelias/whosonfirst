const fs = require('fs');
const path = require('path');
const _ = require('lodash');

const peliasConfig = require('pelias-config').generate(require('../schema'));

// the importer depends on hierarchy bundles being imported in highest to
// lowest level order. See https://github.com/whosonfirst/whosonfirst-placetypes
// for info on what each bundle type means
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

const SQLITE_REGEX = /whosonfirst-data-[a-z0-9-]+\.db$/;

function getPlacetypes() {
  let roles = hierarchyRoles;

  if (peliasConfig.imports.whosonfirst.importPostalcodes && process.argv[2] !== '--admin-only') {
    roles = roles.concat(postalcodeRoles);
  }

  return roles;
}

function getDBList(callback) {
  //Allow to use the wof root directory instead of the sqlite subdirectory
  let databasesPath = peliasConfig.imports.whosonfirst.datapath;
  if (fs.existsSync(path.join(peliasConfig.imports.whosonfirst.datapath, 'sqlite'))) {
    databasesPath = path.join(peliasConfig.imports.whosonfirst.datapath, 'sqlite');
  }
  console.debug(databasesPath);
  //ensure required directory structure exists
  fs.mkdirSync(databasesPath, { recursive: true });
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
  callback('Bundles are no longer supported!');
}

module.exports.getPlacetypes = getPlacetypes;
module.exports.generateBundleList = getList;
