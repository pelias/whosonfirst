
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
  const wofDataHost = config.dataHost || 'https://dist.whosonfirst.org';
  const sqliteDir = path.join(config.datapath, 'sqlite');
  fs.ensureDirSync(sqliteDir);

  // generate a download function per database listed in config
  const downloadFunctions = options.databases.map(filename => {
    return (done) => {

      // build shell command
      const options = { cwd: __dirname };
      const cmd = './sqlite_download.sh';
      const args = [ filename, path.join( sqliteDir, filename ), wofDataHost ];
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
  // (the maximum is configurable, to keep things from getting too intense, and defaults to 4)
  // lower this number to make the downloader more CPU friendly
  // raise this number to (possibly) make it faster
  const maxSimultaneousDownloads = config.maxDownloads || 4;
  const cpuCount = os.cpus().length;
  const simultaneousDownloads = Math.max(maxSimultaneousDownloads, Math.min(1, cpuCount / 2));

  // download all files
  async.parallelLimit(downloadFunctions, simultaneousDownloads, callback);
}

module.exports.download = download;
