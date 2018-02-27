
const fs = require('fs-extra');
const path = require('path');
const Sqlite3 = require('better-sqlite3');

// load configuration variables
const config = require( 'pelias-config' ).generate(require('../schema')).imports.whosonfirst;
const sqliteFiles = config.sqlite_files;

// ensure sqlite_files array is specified in config
if( !Array.isArray( config.sqlite_files ) || !config.sqlite_files.length ){
  console.error('you must specify the imports.whosonfirst.sqlite_files array in your pelias.json');
  process.exit(1);
}

// ensure required directory structure exists
const metaDir = path.join(config.datapath, 'meta');
const dataDir = path.join(config.datapath, 'data');
fs.ensureDirSync(metaDir);
fs.ensureDirSync(dataDir);

// sql statements
const sql = {
  data: `SELECT id, body FROM geojson
  WHERE id IN (
    SELECT id
    FROM ancestors
    WHERE id = @wofid
    OR ancestor_id = @wofid
    GROUP BY id
    ORDER BY id ASC
  );`,
  meta: `SELECT * FROM spr
  WHERE id IN (
    SELECT id
    FROM ancestors
    WHERE id = @wofid
    OR ancestor_id = @wofid
    GROUP BY id
    ORDER BY id ASC
  );`
};

// extract from a single db file
function extract( dbpath ){
  let targetWofId = config.importPlace;

  // connect to sql db
  let db = new Sqlite3( dbpath, { readonly: true } );

  // extract all data to disk
  for( let row of db.prepare(sql.data).iterate({ wofid: targetWofId }) ){
    writeJson( row );
  }

  // write meta data to disk
  writeMeta( db.prepare(sql.meta).all({ wofid: targetWofId }) );

  // close connection
  db.close();
}

// extract from all database files
config.sqlite_files.forEach(file => { extract( file.filename ); });

// write metadata to disk
function writeMeta( rows ){
  let placetypeCounts = {};

  rows.forEach( row => {
    let targetFile = path.join(metaDir, `${row.placetype}.csv`);

    // first time we have seen a record for this placetype
    if( !placetypeCounts.hasOwnProperty( row.placetype ) ){

      // init the placetype counter
      placetypeCounts[ row.placetype ] = 0;

      // write csv header line
      fs.writeFileSync( targetFile, Object.keys(row).join(',') + '\n', 'utf8' );
    }

    // write csv row
    fs.appendFile( targetFile, Object.keys(row).map(key => row[key]).join(',') + '\n', 'utf8' );
  });
}

// write json to disk
function writeJson( row ){
  let targetDir = path.join(dataDir, wofIdToPath(row.id).join(path.sep));
  fs.ensureDir(targetDir, (error) => {
    if( error ){ console.error(`error making directory ${targetDir}`); }
    fs.writeFileSync( path.join(targetDir, `${row.id}.geojson`), row.body, 'utf8' );
  });
}

// convert wofid integer to array of path components
function wofIdToPath( id ){
  let strId = id.toString();
  let parts = [];
  while( strId.length ){
    let part = strId.substr(0, 3);
    parts.push(part);
    strId = strId.substr(3);
  }
  return parts;
}
