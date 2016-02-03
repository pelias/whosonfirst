var bz2 = require('unbzip2-stream');
var tar = require('tar-stream');
var fs = require('fs-extra');
var _ = require('lodash');
var https = require('https');
var util = require('util');
var path = require('path');
var sep = require('path').sep;

// strip off the first component and prepend new root:
//  e.g. `reassignRoot('original_root/1/2.geojson', 'new_root')` -> `new_root/1/2.geojson`
function reassignRoot(filename, root) {
  // grab all the path elements except the root
  var nonRootParts = filename.split(sep).slice(1);

  // join them all together, prepended with the new root
  return path.join.apply(this, [root].concat(nonRootParts));

}

// setup a `meta` directory in which to place .csv files
fs.ensureDirSync(path.join('wof_data', 'meta'));

// setup a function that handles entries from tar-stream
var handleEntry = function(header, stream, callback) {
  var name;

  try {
    if (header.type === 'directory') {
      name = reassignRoot(header.name, 'wof_data');
      fs.mkdirsSync(name);
    }
    if (_.endsWith(header.name, '.geojson')) {
      name = reassignRoot(header.name, 'wof_data');
      stream.pipe(fs.createWriteStream(name));
    }
    if (_.endsWith(header.name, '.csv')) {
      name = reassignRoot(header.name, path.join('wof_data', 'meta'));
      stream.pipe(fs.createWriteStream(name));
    }

  } catch (err) {
    console.error('error processing ' + header.name);
    console.error('exception: ' + err);
  }

  callback();

};

// separate out to function to eliminate scope issues when referencing `type`
function handleType(type) {
  console.log('starting ' + type);
  https.get(util.format('https://whosonfirst.mapzen.com/bundles/wof-%s-latest-bundle.tar.bz2', type), function(response) {
    response
      .pipe(bz2())
      .pipe(tar.extract()
        .on('entry', handleEntry)
        .on('finish', function() { console.log('done ' + type); }));
  });
}

[
  'continent',
  'country',
  'county',
  'dependency',
  'disputed',
  'localadmin',
  'locality',
  'macrocounty',
  'macroregion',
  'neighbourhood',
  'region'
].forEach(function(type) {
  handleType(type);
});
