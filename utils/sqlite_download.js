
const os = require('os');
const util = require('util');
const path = require('path');
const fs = require('fs-extra');
const child_process = require('child_process');
const async = require('async');
const common = require('./sqlite_common');

function download(options, callback){

  // load configuration variables
  const config = require('pelias-config').generate(require('../schema')).imports.whosonfirst;

  // generate a download function per database listed in config
  const downloadFunctions = options.databases.map(filename => {
    return (done) => {

      // build shell command
      const options = { cwd: path.basename(__dirname) };
      const cmd = './sqlite_download.sh';
      const args = [ filename, path.join( config.datapath, filename ) ];
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
          console.error('error downloading: ' + filename);
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
  async.parallelLimit(downloadFunctions, simultaneousDownloads, callback);
}

module.exports.download = download;
