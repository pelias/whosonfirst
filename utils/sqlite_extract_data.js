
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
  WHERE spr.id @placefilter;`,
  meta: `SELECT
    json_extract(body, '$.bbox[0]') || ',' ||
    json_extract(body, '$.bbox[1]') || ',' ||
    json_extract(body, '$.bbox[2]') || ',' ||
    json_extract(body, '$.bbox[3]') AS bbox,
    json_extract(body, '$.properties.edtf:cessation') AS cessation,
    json_extract(body, '$.properties.wof:hierarchy[0].country_id') AS country_id,
    json_extract(body, '$.properties.edtf:deprecated') AS deprecated,
    '' AS file_hash,
    '' AS fullname,
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
  WHERE id @placefilter;`,
  subdiv: `SELECT DISTINCT LOWER( IFNULL(
    json_extract(body, '$.properties."wof:subdivision"'),
    json_extract(body, '$.properties."iso:country"')
  )) AS subdivision
  FROM geojson
  WHERE id @placefilter
  AND subdivision != '';`,
  placefilter: `IN (
    SELECT DISTINCT id
    FROM ancestors
    WHERE id IN (@wofids)
    UNION
    SELECT DISTINCT id
    FROM ancestors
    WHERE ancestor_id IN (@wofids)
    UNION
    SELECT DISTINCT ancestor_id
    FROM ancestors
    WHERE id IN (@wofids)
  )`
};

function extract(options, callback){

  // load configuration variables
  const config = require('pelias-config').generate(require('../schema')).imports.whosonfirst;

  // location of data and meta dirs
  const metaDir = path.join(config.datapath, 'meta');
  const dataDir = path.join(config.datapath, 'data');
  const sqliteDir = path.join(config.datapath, 'sqlite');

  // unlink (truncate meta and data dirs)
  if( options && true === options.unlink ){
    fs.removeSync(metaDir);
    fs.removeSync(dataDir);
  }

  // ensure required directory structure exists
  fs.ensureDirSync(metaDir);
  fs.ensureDirSync(dataDir);
  fs.ensureDirSync(sqliteDir);

  // open one write stream per metadata file
  // note: important for to ensure meta files are written correctly
  // with only one header per import run
  const metafiles = new common.MetaDataFiles( metaDir );

  // extract from a single db file
  function extractDB( dbpath ){
    let targetWofIds = Array.isArray(config.importPlace) ? config.importPlace: [config.importPlace];

    // connect to sql db
    let db = new Sqlite3( dbpath, { readonly: true } );

    // convert ids to integers and remove any which fail to convert
    let cleanIds = targetWofIds.map(id => parseInt(id, 10)).filter(id => !isNaN(id));

    // placefilter is used to select only records targeted by the 'importPlace' config option
    // note: if no 'importPlace' ids are provided then we process all ids which aren't 0
    let placefilter = (cleanIds.length > 0) ? sql.placefilter : '!= 0';

    // note: we need to use replace instead of bound params in order to be able
    // to query an array of values using IN.
    let dataQuery = sql.data.replace(/@placefilter/g, placefilter).replace(/@wofids/g, cleanIds.join(','));
    let metaQuery = sql.meta.replace(/@placefilter/g, placefilter).replace(/@wofids/g, cleanIds.join(','));

    // extract all data to disk
    for( let row of db.prepare(dataQuery).iterate() ){
      if( 'postalcode' === row.placetype && true !== config.importPostalcodes ){ return; }
      if( 'venue' === row.placetype && true !== config.importVenues ){ return; }
      if( 'constituency' === row.placetype && true !== config.importConstituencies ){ return; }
      if( 'intersection' === row.placetype && true !== config.importIntersections ){ return; }
      writeJson( row );
    }

    // write meta data to disk
    for( let row of db.prepare(metaQuery).iterate() ){
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

    let dbpath = path.join( sqliteDir, filename );
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
  const sqliteDir = path.join(config.datapath, 'sqlite');
  let targetWofIds = Array.isArray(config.importPlace) ? config.importPlace: [config.importPlace];

  // connect to sql db
  let db = new Sqlite3( path.join( sqliteDir, filename ), { readonly: true } );

  // convert ids to integers and remove any which fail to convert
  let cleanIds = targetWofIds.map(id => parseInt(id, 10)).filter(id => !isNaN(id));

  // placefilter is used to select only records targeted by the 'importPlace' config option
  // note: if no 'importPlace' ids are provided then we process all ids which aren't 0
  let placefilter = (cleanIds.length > 0) ? sql.placefilter : '!= 0';

  // query db
  // note: we need to use replace instead of using bound params in order to
  // be able to query an array of values using IN.
  let query = sql.subdiv.replace(/@placefilter/g, placefilter).replace(/@wofids/g, cleanIds.join(','));
  return db.prepare(query).all().map( row => row.subdivision.toLowerCase());
}

module.exports.extract = extract;
module.exports.findSubdivisions = findSubdivisions;