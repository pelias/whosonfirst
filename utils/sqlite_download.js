
const os = require('os');
const util = require('util');
const path = require('path');
const fs = require('fs-extra');
const child_process = require('child_process');
const async = require('async');
const common = require('./sqlite_common');

function download(callback){

  // load configuration variables
  const config = require('pelias-config').generate(require('../schema')).imports.whosonfirst;
  common.validateConfig(config, false);

  // generate a download function per database listed in config
  const downloadFunctions = config.sqliteDatabases.map(entry => {
    return (done) => {

      // build shell command
      const options = { cwd: path.basename(__dirname) };
      const cmd = './sqlite_download.sh';
      const args = [ entry.filename, path.join( entry.path, entry.filename ) ];
      const child = child_process.spawn(cmd, args, options);

      // handle stdio
      function stdio( ioname, buffer ){
        child[ioname].on('data', data => {
          buffer += data;
          let line = data.toString().trim();
          if( line.length ){ console.log( line ); }
        });
      }

      var stdout, stderr;
      stdio( 'stdout', stdout );
      stdio( 'stderr', stderr );

      // handle exit code
      child.on('exit', code => {
        if( '0' !== code.toString() ){
          console.error('error downloading: ' + entry.filename);
          console.error(stdout);
          console.error(stderr);
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
  async.parallelLimit(downloadFunctions, simultaneousDownloads, () => {});

  // no databases specified
  if( !downloadFunctions.length ){
    console.error('no sqlite databases specified!');
    process.exit(1);
  }
}

module.exports.download = download;
