
const fs = require('fs');
const path = require('path');

module.exports.validateConfig = function validateConfig( config, mustExist ){

  // ensure sqliteDatabases array is specified in config
  if( !Array.isArray( config.sqliteDatabases ) || !config.sqliteDatabases.length ){
    console.error('you must specify the imports.whosonfirst.sqliteDatabases array in your pelias.json');
    process.exit(1);
  }

  // ensure importPlace is specified in config
  if( !config.hasOwnProperty('importPlace') ){
    console.error('you must specify a wofid as imports.whosonfirst.importPlace in your pelias.json');
    process.exit(1);
  }

  // ensure entries are valid
  config.sqliteDatabases = config.sqliteDatabases.map(entry => {
    if( entry.filename !== path.basename( entry.filename ) ){
      throw new Error( 'config: sqlite filename should not include path: ' + entry.filename );
    }
    if( !entry.path ){ entry.path = config.datapath; }
    if( !fs.existsSync( entry.path ) ){
      throw new Error( 'config: sqlite path not found: ' + entry.path );
    }
    let absPath = path.join( entry.path, entry.filename );
    if( true === mustExist && !fs.existsSync( absPath ) ){
      throw new Error( 'config: sqlite file not found: ' + absPath );
    }
    return entry;
  });
};

// handler for all metatdata streams
module.exports.MetaDataFiles = function MetaDataFiles( metaDir ){
  let streams = {};
  this.stats = {};
  this.write = function( row ){
    let keys = Object.keys(row);

    // first time writing to this meta file
    if( !streams.hasOwnProperty( row.placetype ) ){

      // create write stream
      streams[row.placetype] = fs.createWriteStream(
        path.join( metaDir, `wof-${row.placetype}-latest.csv` )
      );

      // init stats
      this.stats[row.placetype] = 0;

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

    // increment stats
    this.stats[row.placetype]++;
  };
};
