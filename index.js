var fs = require( 'fs' );
var util = require( 'util' );
var glob = require( 'glob' );
var combinedStream = require( 'combined-stream' );

var files = glob.sync( '../../whosonfirst-data/data/**/*[0-9].geojson' );

console.log('importing ' + files.length + ' files');

var wofRecords = {};

files.forEach( function forEach( wofFile ) {
  if (wofFile.indexOf('85633345.geojson') !== -1) {
    return;
  }

  var wofRecord = JSON.parse(fs.readFileSync(wofFile));

  var id = wofRecord.id;

  if (!wofRecord.hasOwnProperty('properties')) {
    console.log(wofFile + ' has no properties');
  }
  else if (!id) {
    console.log(wofFile + ' has no id');
  }
  else {
    if (wofRecords[id]) {
      console.log(id + ' is a duplicate');
    }

    wofRecords[id] = {
      'n': wofRecord.properties['wof:name'],
      'pr': wofRecord.properties['wof:parent_id']
      // 'pt': wofRecord.properties['wof:path'],
      // 'h': wofRecord.properties['wof:hierarchy'],
      // 'gh': wofRecord.properties['wof:geomhash'],
      // 'lat': wofRecord.properties['geom:latitude'],
      // 'lon': wofRecord.properties['geom:longitude'],
      // 'pt': wofRecord.properties['wof:placetype'],
      // 'bb': wofRecord.bbox,
      // 'g': wofRecord.geometry
    }

  }

});

console.log(Object.keys(wofRecords).length + ' records loaded');

process.stdin.on('data', function (text) {
  process.exit();
});

// console.log(wofRecords);

/*
wof:hierarchy': [{u'country_id': 85633793,
                     u'county_id': 102080953,
                     u'locality_id': 101717221,
                     u'region_id': 85688481}],
                     */
