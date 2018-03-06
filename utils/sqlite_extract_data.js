
const fs = require('fs-extra');
const path = require('path');
const Sqlite3 = require('better-sqlite3');
const wofIdToPath = require('../src/wofIdToPath');

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
  data: `SELECT spr.id, spr.placetype, geojson.body FROM geojson
  JOIN spr ON geojson.id = spr.id
  WHERE spr.id IN (
    SELECT @wofid
    UNION
    SELECT DISTINCT id
    FROM ancestors
    WHERE ancestor_id = @wofid
    UNION
    SELECT DISTINCT ancestor_id
    FROM ancestors
    WHERE id = @wofid
  );`,
  meta: `SELECT
    json_extract(body, '$.bbox[0]') || ',' ||
    json_extract(body, '$.bbox[1]') || ',' ||
    json_extract(body, '$.bbox[2]') || ',' ||
    json_extract(body, '$.bbox[3]') AS bbox,
    json_extract(body, '$.properties.edtf:cessation') AS cessation,
    json_extract(body, '$.properties.wof:hierarchy[0].country_id') AS country_id,
    json_extract(body, '$.properties.edtf:deprecated') AS deprecated,
    "" AS file_hash,
    "" AS fullname,
    json_extract(body, '$.properties.geom:hash') AS geom_hash,
    json_extract(body, '$.properties.geom:latitude') AS geom_latitude,
    json_extract(body, '$.properties.geom:longitude') AS geom_longitude,
    json_extract(body, '$.properties.wof:id') AS id,
    json_extract(body, '$.properties.edtf:inception') AS inception,
    json_extract(body, '$.properties.iso:country') AS iso,
    json_extract(body, '$.properties.iso:country') AS iso_country,
    json_extract(body, '$.properties.wof:lastmodified') AS lastmodified,
    json_extract(body, '$.properties.lbl:latitude') AS lbl_latitude,
    json_extract(body, '$.properties.lbl:longitude') AS lbl_longitude,
    json_extract(body, '$.properties.wof:hierarchy[0].locality_id') AS locality_id,
    json_extract(body, '$.properties.wof:name') AS name,
    json_extract(body, '$.properties.wof:parent_id') AS parent_id,
    REPLACE(
      REPLACE(
        SUBSTR(json_extract(body, '$.properties.wof:id'),1,3) ||'/'||
        SUBSTR(json_extract(body, '$.properties.wof:id'),4,3) ||'/'||
        SUBSTR(json_extract(body, '$.properties.wof:id'),7,3) ||'/'||
        SUBSTR(json_extract(body, '$.properties.wof:id'),10)  ||'/'||
        json_extract(body, '$.properties.wof:id') || '.geojson',
      '//', '/'),
    '//','/') AS path,
    json_extract(body, '$.properties.wof:placetype') AS placetype,
    json_extract(body, '$.properties.wof:hierarchy[0].region_id') AS region_id,
    json_extract(body, '$.properties.src:geom') AS source,
    json_extract(body, '$.properties.wof:superseded_by[0]') AS superseded_by,
    json_extract(body, '$.properties.wof:supersedes[0]') AS supersedes,
    json_extract(body, '$.properties.wof:country') AS wof_country
  FROM geojson
  WHERE id IN (
    SELECT @wofid
    UNION
    SELECT DISTINCT id
    FROM ancestors
    WHERE ancestor_id = @wofid
    UNION
    SELECT DISTINCT ancestor_id
    FROM ancestors
    WHERE id = @wofid
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
    if( 'postalcode' === row.placetype && true !== config.importPostalcodes ){ return; }
    if( 'venue' === row.placetype && true !== config.importVenues ){ return; }
    writeJson( row );
  }

  // write meta data to disk
  for( let row of db.prepare(sql.meta).iterate({ wofid: targetWofId }) ){
    if( 'postalcode' === row.placetype && true !== config.importPostalcodes ){ return; }
    if( 'venue' === row.placetype && true !== config.importVenues ){ return; }
    if( !row.hasOwnProperty('path') ){
      // ensure path property is present (required by some importers)
      row.path = wofIdToPath(row.id).concat(row.id+'.geojson').join(path.sep);
    }
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

// handler for all metatdata streams
function MetaDataFiles(){
  let streams = {};
  this.write = function( row ){
    let keys = Object.keys(row);

    // first time writing to this meta file
    if( !streams.hasOwnProperty( row.placetype ) ){

      // create write stream
      streams[row.placetype] = fs.createWriteStream(
        path.join( metaDir, `wof-${row.placetype}-latest.csv` )
      );

      // write csv header
      streams[row.placetype].write( keys.join(',') + '\n' );
    }

    // write csv row
    streams[row.placetype].write( keys.map(key => {
      // quote fields containing comma or newline, escape internal quotes
      // https://gist.github.com/getify/3667624
      if( /[,\n]/.test( row[key] ) ) {
        return '"' + row[key].replace(/\\([\s\S])|(")/g,'\\$1$2') + '"';
      }
      return row[key];
    }).join(',') + '\n' );
  };
}
