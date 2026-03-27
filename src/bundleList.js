const fs = require('fs');
const path = require('path');
const _ = require('lodash');

const peliasConfig = require('pelias-config').generate(require('../schema'));
const logger = require('pelias-logger').get('whosonfirst');

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
  const dataPath = peliasConfig.imports.whosonfirst.datapath;
  const dataPathWithSQLite = path.join(dataPath, 'sqlite');
  const sqlitePathExists = fs.existsSync(dataPathWithSQLite);

  const dbList = [];
  if (sqlitePathExists) {
    //ensure required directory structure exists
    fs.mkdirSync(dataPathWithSQLite, { recursive: true });
    dbList.push(...fs.readdirSync(dataPathWithSQLite).filter(d => SQLITE_REGEX.test(d)));
    if (_.isEmpty(dbList)) {
      logger.info(`No database found in ${dataPathWithSQLite}, using only databases from ${dataPath}.
                   You may want to delete the sqlite directory.`);
    }
  }
  //ensure required directory structure exists
  fs.mkdirSync(dataPath, { recursive: true });
  dbList.push(...fs.readdirSync(dataPath).filter(d => SQLITE_REGEX.test(d)));

  if (_.isEmpty(dbList)) {
    return callback(`No database found in ${dataPath} or ${dataPathWithSQLite}`);
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
