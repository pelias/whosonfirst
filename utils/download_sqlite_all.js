const child_process = require('child_process');
const async = require('async');
const fs = require('fs-extra');
const os = require('os');
const path = require('path');
const downloadFileSync = require('download-file-sync');

const config = require('pelias-config').generate(require('../schema'));

const wofDataHost = config.get('imports.whosonfirst.dataHost') || 'https://dist.whosonfirst.org';

function download(callback) {
  //ensure required directory structure exists
  fs.ensureDirSync(path.join(config.imports.whosonfirst.datapath, 'sqlite'));

  // download one bundle for every other CPU (tar and bzip2 can both max out one core)
  // (the maximum is configurable, to keep things from getting too intense, and defaults to 4)
  //lower this number to make the downloader more CPU friendly
  //raise this number to (possibly) make it faster
  const maxSimultaneousDownloads = config.get('imports.whosonfirst.maxDownloads') || 4;
  const cpuCount = os.cpus().length;
  const simultaneousDownloads = Math.max(maxSimultaneousDownloads, Math.min(1, cpuCount / 2));

  const generateSQLites = () => {
    const files = {};
    const content = JSON.parse(downloadFileSync(`${wofDataHost}/sqlite/inventory.json`))
       // Only latest compressed files
      .filter(e => e.name_compressed.indexOf('latest') >= 0)
      // Postalcodes only when importPostalcodes is ture and without --admin-only arg
      .filter(e => e.name_compressed.indexOf('postalcode') < 0 ||
        (config.imports.whosonfirst.importPostalcodes && process.argv[2] !== '--admin-only'))
      // Venues only when importVenues is true and without --admin-only arg
      .filter(e => e.name_compressed.indexOf('venue') < 0 ||
        (config.imports.whosonfirst.importVenues && process.argv[2] !== '--admin-only'))
      // We don't need constituency and intersection ?
      .filter(e => e.name_compressed.indexOf('constituency') < 0 && e.name_compressed.indexOf('intersection') < 0)
      // Remove duplicates based on name, we can have differents name_compressed
      // (for example whosonfirst-data-latest.db.bz2 and whosonfirst-data-latest.db.tar.bz2)
      // but with the same name... We will take the newer version.
      .forEach(e => {
        if (files[e.name] && new Date(e.last_modified) > new Date(files[e.name].last_modified)) {
          files[e.name] = e;
        } else if (!files[e.name]) {
          files[e.name] = e;
        }
      });
    return Object.values(files);
  };

  const generateCommand = (sqlite, directory) => {
    let extract;
    if (/\.db\.bz2$/.test(sqlite.name_compressed)) {
      extract = `bunzip2`;
    } else if(/\.db\.tar\.bz2$/.test(sqlite.name_compressed)) {
      extract = `tar -xjO`;
    } else {
      throw new Error('What is this extension ?!?');
    }

    return `curl -s ${wofDataHost}/sqlite/${sqlite.name_compressed} | ${extract} > ${path.join(directory, 'sqlite', sqlite.name)}`;
  };

  const downloadFunctions = generateSQLites().map(function (sqlite) {
    return function downloadABundle(callback) {
      const cmd = generateCommand(sqlite, config.imports.whosonfirst.datapath);
      console.log('Downloading ' + sqlite.name_compressed);
      child_process.exec(cmd, function commandCallback(error, stdout, stderr) {
        console.log('done downloading ' + sqlite.name_compressed);
        if (error) {
          console.error('error downloading ' + sqlite.name_compressed + error);
          console.log(stderr);
        }
        callback();
      });
    };
  });

  async.parallelLimit(downloadFunctions, simultaneousDownloads, callback);
}

module.exports.download = download;
