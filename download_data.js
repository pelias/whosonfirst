var child_process = require('child_process');
var async = require('async');
var os = require('os');

var bundles = require('./src/bundleList');
var config = require('pelias-config').generate();

// download one bundle for every other CPU (tar and bzip2 can both max out one core)
// (but not more than 4, to keep things from getting too intense)
// lower this number to make the downloader more CPU friendly
// raise this number to (possibly) make it faster
var simultaneousDownloads = Math.max(4, Math.min(1, os.cpus().length / 2));

/*
 * generate a shell command that does the following:
 * 1.) use curl to download the bundle, piping directly to tar (this avoids the need for intermediate storage of the archive file)
 * 2.) extract the archive so that the data directory goes in the right place and the README file is ignored (it just would get overridden by subsequent bundles)
 * 3.) move the meta file to the meta files directory
 */
function generateCommand(type, directory) {
  return 'curl https://whosonfirst.mapzen.com/bundles/wof-' + type + '-latest-bundle.tar.bz2 | tar -xj --strip-components=1 --exclude=README.txt -C ' + directory + ' && mv ' + directory + '/wof-' + type  + '-latest.csv ' + directory + '/meta/';
}

var bundlesToDownload = bundles.hierarchyBundles;

if (config.imports.whosonfirst.importVenues) {
  bundlesToDownload = bundlesToDownload.concat(bundles.venueBundles);
}

// this should override the config setting since the hierarchy bundles are useful
// on their own to allow other importers to start when using admin lookup
if (process.argv[2] == '--admin-only') {
  bundlesToDownload = bundles.hierarchyBundles;
}

var downloadFunctions = bundlesToDownload.map(function(type) {
  return function downloadABundle(callback) {
    var cmd = generateCommand(type, config.imports.whosonfirst.datapath);
    console.log('Downloading ' + type + ' bundle');
    child_process.exec(cmd, function commandCallback(error, stdout, stderr) {
      console.log('done downloading ' + type + ' bundle');
      if (error) {
        console.error('error downloading ' + type + ' bundle: ' + error);
        console.log(stderr);
      }
      callback();
    });
  };
});

async.parallelLimit(downloadFunctions, simultaneousDownloads, function allDone() {
  console.log('All done downloading WOF!');
});
