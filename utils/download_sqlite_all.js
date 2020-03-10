const child_process = require('child_process');
const async = require('async');
const fs = require('fs-extra');
const os = require('os');
const path = require('path');
const downloadFileSync = require('download-file-sync');
const commandExistsSync = require('command-exists').sync;

const config = require('pelias-config').generate(require('../schema'));

const DATA_GEOCODE_EARTH_URL = 'https://data.geocode.earth/wof/dist';
const DATA_WOF_URL = 'https://dist.whosonfirst.org';
const wofDataHost = config.get('imports.whosonfirst.dataHost') || DATA_GEOCODE_EARTH_URL;
const COMBINED_REGEX = /^whosonfirst-data-(admin|postalcode|venue)-latest/;

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
  const countryFilter = () => {
    const countries = Array.isArray(config.imports.whosonfirst.countries) ?
    config.imports.whosonfirst.countries : [config.imports.whosonfirst.countries];
    return (e) => {
      if (countries.length === 0) {
        return COMBINED_REGEX.test(e.name_compressed);
      }
      return countries.some(c => e.name_compressed.indexOf(`-${c}-latest`) >= 0);
    };
  };

  const importVenues = () => {
    return config.imports.whosonfirst.importVenues && process.argv[2] !== '--admin-only';
  };

  const venueFilter = (venuesOnly) => {
    return (e) => {
      if (venuesOnly) {
        return e.name_compressed.indexOf('venue') >= 0;
      }
      return e.name_compressed.indexOf('venue') < 0 || importVenues();
    };
  };

  const generateSQLites = (url, venuesOnly) => {
    const files = {};
    const content = JSON.parse(downloadFileSync(`${url}/sqlite/inventory.json`))
      // Only latest compressed files
      .filter(e => e.name_compressed.indexOf('latest') >= 0)
      // Only wanted countries
      .filter(countryFilter())
      // Postalcodes only when importPostalcodes is ture and without --admin-only arg
      .filter(e => e.name_compressed.indexOf('postalcode') < 0 ||
        (config.imports.whosonfirst.importPostalcodes && process.argv[2] !== '--admin-only'))
      // Venues only when importVenues is true and without --admin-only arg
      .filter(venueFilter(venuesOnly))
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
        e.downloadUrl = `${url}/sqlite/${e.name_compressed}`;
      });
    return Object.values(files);
  };

  const generateCommand = (sqlite, directory) => {
    let extract;
    if (/\.db\.bz2$/.test(sqlite.name_compressed)) {
      // Check if we have lbunzip2 installed
      if (commandExistsSync('lbunzip2')) {
        extract = 'lbunzip2';
      } else {
        extract = 'bunzip2';
      }
    } else if (/\.db\.tar\.bz2$/.test(sqlite.name_compressed)) {
      // Check if we have lbzip2 installed
      if (commandExistsSync('lbzip2')) {
        extract = 'tar -xO --use-compress-program=lbzip2';
      } else {
        extract = 'tar -xj';
      }
    } else {
      throw new Error('What is this extension ?!?');
    }

    return `curl -s ${sqlite.downloadUrl} | ${extract} > ${path.join(directory, 'sqlite', sqlite.name)}`;
  };

  // All SQLites to download, if Venues are activated, we add some download from WOF.
  const generatedSQLites = generateSQLites(wofDataHost).concat(
    wofDataHost === DATA_GEOCODE_EARTH_URL && importVenues() ? generateSQLites(DATA_WOF_URL, true) : []
  );

  const downloadFunctions = generatedSQLites.map(function (sqlite) {
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
