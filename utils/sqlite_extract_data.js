
const fs = require('fs-extra');
const path = require('path');
const util = require('util');
const Sqlite3 = require('better-sqlite3');
const common = require('./sqlite_common');
const wofIdToPath = require('../src/wofIdToPath');

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
  );`,
  subdiv: `SELECT DISTINCT LOWER( IFNULL(
    json_extract(body, '$.properties."wof:subdivision"'),
    json_extract(body, '$.properties."iso:country"')
  )) AS subdivision
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
  )
  AND subdivision != '';`,
};

function extract(options, callback){

  // load configuration variables
  const config = require('pelias-config').generate(require('../schema')).imports.whosonfirst;

  // location of data and meta dirs
  const metaDir = path.join(config.datapath, 'meta');
  const dataDir = path.join(config.datapath, 'data');

  // unlink (truncate meta and data dirs)
  if( options && true === options.unlink ){
    fs.removeSync(metaDir);
    fs.removeSync(dataDir);
  }

  // ensure required directory structure exists
  fs.ensureDirSync(metaDir);
  fs.ensureDirSync(dataDir);

  // open one write stream per metadata file
  // note: important for to ensure meta files are written correctly
  // with only one header per import run
  const metafiles = new common.MetaDataFiles( metaDir );

  // extract from a single db file
  function extractDB( dbpath ){
    let targetWofId = config.importPlace;

    // connect to sql db
    let db = new Sqlite3( dbpath, { readonly: true } );

    // extract all data to disk
    for( let row of db.prepare(sql.data).iterate({ wofid: targetWofId }) ){
      if( 'postalcode' === row.placetype && true !== config.importPostalcodes ){ return; }
      if( 'venue' === row.placetype && true !== config.importVenues ){ return; }
      if( 'constituency' === row.placetype && true !== config.importConstituencies ){ return; }
      if( 'intersection' === row.placetype && true !== config.importIntersections ){ return; }
      writeJson( row );
    }

    // write meta data to disk
    for( let row of db.prepare(sql.meta).iterate({ wofid: targetWofId }) ){
      if( 'postalcode' === row.placetype && true !== config.importPostalcodes ){ return; }
      if( 'venue' === row.placetype && true !== config.importVenues ){ return; }
      if( 'constituency' === row.placetype && true !== config.importConstituencies ){ return; }
      if( 'intersection' === row.placetype && true !== config.importIntersections ){ return; }
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
  options.databases.forEach( filename => {

    let dbpath = path.join( config.datapath, filename );
    if( !fs.existsSync( dbpath ) ){
      console.error('not found:', dbpath);
      return;
    }

    extractDB( dbpath );
  });

  // print stats
  if( Object.keys( metafiles.stats ).length ){
    Object.keys( metafiles.stats ).forEach( key => {
      console.error( util.format('extracted %d %s(s)',
        metafiles.stats[key], key
      ));
    });
  } else {
    console.error('failed to extract any records!');
  }

  callback();

  // ----------------------------------------------------------------------------

  // write json to disk
  function writeJson( row ){
    let targetDir = path.join(dataDir, wofIdToPath(row.id).join(path.sep));
    try {
      fs.ensureDirSync(targetDir);
      fs.writeFileSync( path.join(targetDir, `${row.id}.geojson`), row.body, 'utf8' );
    } catch( error ){
      if( error ){ console.error(`error making directory ${targetDir}`); }
    }
  }
}

// return all distinct subdivisions of the data
function findSubdivisions( filename ){

  // load configuration variables
  const config = require('pelias-config').generate(require('../schema')).imports.whosonfirst;
  let targetWofId = config.importPlace;

  // connect to sql db
  let db = new Sqlite3( path.join( config.datapath, filename ), { readonly: true } );

  // query db
  // console.error( sql.subdiv.replace(/@wofid/g, targetWofId) );
  return db.prepare(sql.subdiv).all({ wofid: targetWofId }).map( row => row.subdivision.toLowerCase());
}

module.exports.extract = extract;
module.exports.findSubdivisions = findSubdivisions;
