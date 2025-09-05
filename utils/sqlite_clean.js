const Sqlite3 = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const generateBundleList = require('../src/bundleList').generateBundleList;
const config = require('pelias-config').generate(require('../schema')).imports.whosonfirst;

if (config.sqlite) {
  const filters = ` id = 1 OR name = ''
    OR is_deprecated != 0 OR is_superseded != 0
    OR (spr.latitude != 0 AND spr.longitude != 0)
    OR placetype = 'venue'
    OR placetype = 'intersection'` +
    (config.importPostalcodes ? '' : ` OR placetype = 'postalcode' `) +
    (config.importConstituencies ? '' : ` OR placetype = 'constituency' `);
  generateBundleList((e, dbList) => {
    if (e) {
      console.error(e);
      return;
    }
    let sqlitePath = path.join(config.datapath);
    if (fs.existsSync(path.join(config.datapath, 'sqlite'))) {
      sqlitePath = path.join(config.datapath, 'sqlite');
    }
    dbList.forEach(datapath => {
      const sqlite = new Sqlite3(path.join(sqlitePath, datapath));
      sqlite
        .exec('DROP TABLE IF EXISTS names;')
        .exec('DROP TABLE IF EXISTS concordances;')
        .exec(`DELETE FROM geojson WHERE id IN(SELECT id FROM spr WHERE ${filters});`)
        .exec(`DELETE FROM spr WHERE ${filters};`)
        .exec('vacuum;');
    });
  });
} else {
  console.log('nothing to do');
}