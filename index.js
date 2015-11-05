var fs = require( 'fs' );
var util = require( 'util' );
var glob = require( 'glob' );
var peliasConfig = require( 'pelias-config' ).generate();
var combinedStream = require( 'combined-stream' );
var logger = require( 'pelias-logger' ).get( 'openaddresses' );
var peliasDbclient = require( 'pelias-dbclient' );
var through = require('through2');
var peliasModel = require('pelias-model');

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

/**
 * Create the Pelias elasticsearch import pipeline.
 *
 * @return {stream.Writable} The entry point to the elasticsearch pipeline,
 *    which will perform additional processing on inbound `Document` objects
 *    before indexing them in the elasticsearch pelias index.
 */
function createPeliasElasticsearchPipeline(){
  var dbclientMapper = through.obj( function( model, enc, next ){
    this.push({
      _index: 'pelias',
      _type: model.getType(),
      _id: model.getId(),
      data: model
    });
    next();
  });

  var entryPoint = dbclientMapper;
  entryPoint.pipe( peliasDbclient() );

  return entryPoint;
}

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
