
const os = require('os');
const util = require('util');
const path = require('path');
const fs = require('fs-extra');
const child_process = require('child_process');
const async = require('async');
const common = require('./sqlite_common');

// load configuration variables
const config = require('pelias-config').generate(require('../schema')).imports.whosonfirst;
common.validateConfig(config, false);

// generate a download function per database listed in config
const downloadFunctions = config.sqliteDatabases.map(entry => {
  return (done) => {

    // build shell command
    const cmd = util.format(
      'curl https://dist.whosonfirst.org/sqlite/%s.bz2 | bunzip2 > %s',
      entry.filename,
      path.join( entry.path, entry.filename )
    );

    console.log('downloading: ' + entry.filename);
    child_process.exec(cmd, (error, stdout, stderr) => {
      console.log('done downloading: ' + entry.filename);
      if( error ){
        console.error('error downloading: ' + entry.filename + ': ' + error);
        console.error( stderr );
      }
      done();
    });
  };
});

// download one database for every other CPU (tar and bzip2 can both max out one core)
// (but not more than 4, to keep things from getting too intense)
// lower this number to make the downloader more CPU friendly
// raise this number to (possibly) make it faster
const simultaneousDownloads = Math.max(4, Math.min(1, os.cpus().length / 2));

// download all files
async.parallelLimit(downloadFunctions, simultaneousDownloads, () => {
  console.error( 'done!' );
});
