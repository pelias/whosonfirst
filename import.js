var fs = require( 'fs' );
var glob = require( 'glob' );
var peliasModel = require('pelias-model');
var createPeliasElasticsearchPipeline = require('./src/elasticsearchPipeline');

var files = glob.sync( '../../whosonfirst-data/data/**/*[0-9].geojson' );

var Document = require('pelias-model').Document;

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

var Readable = require('stream').Readable;
var rs = new Readable({objectMode: true});
rs.pipe(createPeliasElasticsearchPipeline());

Object.keys(wofRecords).forEach(function(objectKey) {
  var item = wofRecords[objectKey];
  var wofDoc = new peliasModel.Document( 'whosonfirst', item.id );
  if (item.n) {
    wofDoc.setName('default', item.name);
  }
  wofDoc.setCentroid({ lat: item.lat, lon: item.lon});

  rs.push(wofDoc);
});

rs.push(null);
