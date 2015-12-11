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
      { id: 1 },
      { id: 2 },
      { id: 3 },
      { id: 4 }
    ]);

    // generate Documents that just set the name to 'name ' plus the id
    var documentGenerator = map_stream.obj(function(record) {
      return new Document( 'whosonfirst', record.id ).setName('default', 'name ' + record.id);
    });

    // verifies that Documents end up in the destination
    var destination_pipe = sink.obj(function(record) {
      docs.push(record);
    });

    importStream(recordStream, documentGenerator, destination_pipe, function() {
      t.deepEqual(docs, [
        new Document( 'whosonfirst', '1' ).setName('default', 'name 1'),
        new Document( 'whosonfirst', '2' ).setName('default', 'name 2'),
        new Document( 'whosonfirst', '3' ).setName('default', 'name 3'),
        new Document( 'whosonfirst', '4' ).setName('default', 'name 4')
      ]);
      t.end();

    });

  });

});
