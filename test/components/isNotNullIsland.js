const tape = require('tape');
const event_stream = require('event-stream');

const isNotNullIsland = require('../../src/components/isNotNullIsland');

function test_stream(input, testedStream, callback) {
    var input_stream = event_stream.readArray(input);
    var destination_stream = event_stream.writeArray(callback);

    input_stream.pipe(testedStream).pipe(destination_stream);
}

tape('isNotNullIsland tests', (test) => {
  test.test('id=1 should return false', (t) => {
    test_stream([{ id: 1 }], isNotNullIsland.create(), (err, actual) => {
      t.deepEqual(actual, [], 'should have returned false');
      t.end();
    });

  });

  test.test('id=\'1\' should return false', (t) => {
    test_stream([{ id: '1' }], isNotNullIsland.create(), (err, actual) => {
      t.deepEqual(actual, [], 'should have returned false');
      t.end();
    });

  });

  test.test('id != 1 should return true', (t) => {
    test_stream([{ id: 2 }], isNotNullIsland.create(), (err, actual) => {
      t.deepEqual(actual, [{ id: 2 }], 'should have returned true');
      t.end();
    });

  });

});
