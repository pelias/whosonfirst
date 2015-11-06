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

var stream_array = require('stream-array');
var map_stream = require('through2-map');
var filter_stream = require('through2-filter');

var id_stream = stream_array(Object.keys(wofRecords));

var object_getter_stream = map_stream.obj(function(id) {
  return wofRecords[id];
});

var document_stream = map_stream.obj(function(record) {
  var wofDoc = new peliasModel.Document( 'whosonfirst', record.id );
  if (record.name) {
    wofDoc.setName('default', record.name);
  }
  wofDoc.setCentroid({ lat: record.lat, lon: record.lon});

  return wofDoc;
});

id_stream.pipe(object_getter_stream)
.pipe(document_stream)
.pipe(createPeliasElasticsearchPipeline());
