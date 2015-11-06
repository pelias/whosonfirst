var fs = require( 'fs' );
var glob = require( 'glob' );

var files = glob.sync( '../../whosonfirst-data/data/**/*[0-9].geojson' );

console.log('importing ' + files.length + ' files');

var wofRecords = {};

files.forEach( function forEach( wofFile ) {
  var wofRecord = JSON.parse(fs.readFileSync(wofFile));

  var id = wofRecord.id;

  if (!id) {
    return;
  }

  if (!wofRecord.hasOwnProperty('properties')) {
    return;
  }

  if (wofRecords[id]) { // ignore duplicates
    return;
  }

  wofRecords[id] = {
    id: id,
    name: wofRecord.properties['wof:name'],
    // 'h': wofRecord.properties['wof:hierarchy'],
    lat: wofRecord.properties['geom:latitude'],
    lon: wofRecord.properties['geom:longitude'],
    pt: wofRecord.properties['wof:placetype']
  };
});

console.log(Object.keys(wofRecords).length + ' records loaded');

var importStream = require('./src/importStream');

importStream(wofRecords);
