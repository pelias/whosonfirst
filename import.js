var fs = require( 'fs' );
var glob = require( 'glob' );
var peliasModel = require('pelias-model');
var createPeliasElasticsearchPipeline = require('./src/elasticsearchPipeline');

var files = glob.sync( '../../whosonfirst-data/data/**/*[0-9].geojson' );

var Document = require('pelias-model').Document;

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
      'id': id,
      'n': wofRecord.properties['wof:name'],
      'pr': wofRecord.properties['wof:parent_id'],
      // 'pt': wofRecord.properties['wof:path'],
      // 'h': wofRecord.properties['wof:hierarchy'],
      // 'gh': wofRecord.properties['wof:geomhash'],
      'lat': wofRecord.properties['geom:latitude'],
      'lon': wofRecord.properties['geom:longitude'],
      'pt': wofRecord.properties['wof:placetype'],
      // 'bb': wofRecord.bbox,
      // 'g': wofRecord.geometry
    }
  }
});

console.log(Object.keys(wofRecords).length + ' records loaded');

var Readable = require('stream').Readable;
var rs = new Readable({objectMode: true});
rs.pipe(createPeliasElasticsearchPipeline());

Object.keys(wofRecords).forEach(function(objectKey) {
  var item = wofRecords[objectKey];
  var model_id = objectKey;
  var wofDoc = new peliasModel.Document( 'whosonfirst', model_id );
  if (item.n) {
    wofDoc.setName('default', item.n);
  } else {
    console.log('item ' + item.id + ' has no name');
  }
  wofDoc.setCentroid({ lat: item.lat, lon: item.lon});

  rs.push(wofDoc);
});

rs.push(null);
