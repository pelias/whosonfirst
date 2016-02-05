var tape = require('tape');
var importStream = require('../src/importStream');
var sink = require('through2-sink');
var Document = require('pelias-model').Document;
var map_stream = require('through2-map');
var event_stream = require('event-stream');

tape('importStream', function(test) {
  test.test('all wofRecords should be converted to Documents and sent to destination', function(t) {
    var docs = [];

    var recordStream = event_stream.readArray([
      { id: 1, place_type: 'placetype 1' },
      { id: 2, place_type: 'placetype 2' },
      { id: 3, place_type: 'placetype 3' },
      { id: 4, place_type: 'placetype 4' }
    ]);

    // generate Documents that just set the name to 'name ' plus the id
    var documentGenerator = map_stream.obj(function(record) {
      return new Document( 'whosonfirst', record.place_type, record.id ).setName('default', 'name ' + record.id);
    });

    // verifies that Documents end up in the destination
    var destination_pipe = sink.obj(function(record) {
      docs.push(record);
    });

    importStream(recordStream, documentGenerator, destination_pipe, function() {
      var expected = [
        new Document( 'whosonfirst', 'placetype 1', '1' ).setName('default', 'name 1'),
        new Document( 'whosonfirst', 'placetype 2', '2' ).setName('default', 'name 2'),
        new Document( 'whosonfirst', 'placetype 3', '3' ).setName('default', 'name 3'),
        new Document( 'whosonfirst', 'placetype 4', '4' ).setName('default', 'name 4')
      ].map(function(doc) {
        return doc.toESDocument();
      });
      t.deepEqual(docs, expected, 'documents map correctly to import stream results');
      t.end();

    });

  });

});
