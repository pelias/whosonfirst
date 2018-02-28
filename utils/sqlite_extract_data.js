
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

// open one write stream per metadata file
// note: important for to ensure meta files are written correctly
// with only one header per import run
const metafiles = new MetaDataFiles();

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
  for( let row of db.prepare(sql.meta).iterate({ wofid: targetWofId }) ){
    metafiles.write( row );
  }

  // close connection
  db.close();
}

// extract from all database files
config.sqlite_files.forEach(file => { extract( file.filename ); });

// ----------------------------------------------------------------------------

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

// handler for all metatdata streams
function MetaDataFiles(){
  let streams = {};
  this.write = function( row ){
    let keys = Object.keys(row);

    // first time writing to this meta file
    if( !streams.hasOwnProperty( row.placetype ) ){

      // create write stream
      streams[row.placetype] = fs.createWriteStream(
        path.join( metaDir, `${row.placetype}.csv` )
      );

      // write csv header
      streams[row.placetype].write( keys.join(',') + '\n' );
    }

    // write csv row
    streams[row.placetype].write( keys.map(key => {
      // quote fields containing comma or newline
      if( /[,\n]/.test( row[key] ) ) {
        return '"' + row[key] + '"';
      }
      return row[key];
    }).join(',') + '\n' );
  };
}
