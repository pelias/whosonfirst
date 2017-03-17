'use strict';

// validate the WOF importer configuration before continuing
var peliasConfig = require( 'pelias-config' ).generate(require('./schema'));
var readStreamModule = require('./src/readStream');
var importStream = require('./src/importStream');
var peliasDbclient = require( 'pelias-dbclient' );
var peliasDocGenerators = require('./src/peliasDocGenerators');
var hierarchyFinder = require('./src/hierarchyFinder');
var version_checker = require('node-version-checker').default;
var bundles = require('./src/bundleList');

// print a warning if an unsupported Node.JS version is used
version_checker();

var directory = peliasConfig.imports.whosonfirst.datapath;

if (directory.slice(-1) !== '/') {
  directory = directory + '/';
}

// a cache of only admin records, to be used to fill the hierarchy
// of other, lower admin records as well as venues
var wofAdminRecords = {};

bundles.generateBundleList((err, bundlesToImport) => {

  if (err) {
    throw new Error(err.message);
  }

  const bundlesMetaFiles = bundlesToImport.map( (bundle) => { return bundle.replace('-bundle.tar.bz2', '.csv'); });

  var readStream = readStreamModule.create(directory, bundlesMetaFiles, wofAdminRecords);

  // how to convert WOF records to Pelias Documents
  var documentGenerator = peliasDocGenerators.create(hierarchyFinder(wofAdminRecords));

  // the final destination of Pelias Documents
  var dbClientStream = peliasDbclient();

  // import WOF records into ES
  importStream(readStream, documentGenerator, dbClientStream, function () {
    console.log('import finished');
  });
});
