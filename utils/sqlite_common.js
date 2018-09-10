
const fs = require('fs');
const path = require('path');

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
        path.join( metaDir, `whosonfirst-data-${row.placetype}-latest.csv` )
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
