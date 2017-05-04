const tape = require('tape');
const event_stream = require('event-stream');

const recordNotVisitingNullIsland = require('../../src/components/recordNotVisitingNullIsland');

function test_stream(input, testedStream, callback) {
    var input_stream = event_stream.readArray(input);
    var destination_stream = event_stream.writeArray(callback);

    input_stream.pipe(testedStream).pipe(destination_stream);
}

tape('recordHasName', (test) => {
  test.test('non-postalcode placetype records should pass even if lat/lon is 0/0', (t) => {
    const input = {
      placetype: 'non-postalcode',
      geom_latitude: '0.0',
      geom_longitude: '0.0'
    };

    const filter = recordNotVisitingNullIsland.create();

    test_stream([input], filter, function(err, actual) {
      t.deepEqual(actual, [input], 'should have returned true');
      t.end();
    });

  });

  test.test('postalcode placetype records should pass if lat/lon is not 0/0', (t) => {
    const input = {
      placetype: 'postalcode',
      geom_latitude: '12.121212',
      geom_longitude: '21.212121'
    };

    const filter = recordNotVisitingNullIsland.create();

    test_stream([input], filter, function(err, actual) {
      t.deepEqual(actual, [input], 'should have returned true');
      t.end();
    });

  });

  test.test('postalcode placetype records should pass if lat is 0 but lon is not 0', (t) => {
    const input = {
      placetype: 'postalcode',
      geom_latitude: '0.0',
      geom_longitude: '21.212121'
    };

    const filter = recordNotVisitingNullIsland.create();

    test_stream([input], filter, function(err, actual) {
      t.deepEqual(actual, [input], 'should have returned true');
      t.end();
    });

  });

  test.test('postalcode placetype records should pass if lat is not 0 but lon is 0', (t) => {
    const input = {
      placetype: 'postalcode',
      geom_latitude: '12.121212',
      geom_longitude: '0.0'
    };

    const filter = recordNotVisitingNullIsland.create();

    test_stream([input], filter, function(err, actual) {
      t.deepEqual(actual, [input], 'should have returned true');
      t.end();
    });

  });

  test.test('postalcode placetype records should not pass even if lat/lon is 0/0', (t) => {
    const input = {
      placetype: 'postalcode',
      geom_latitude: '0.0',
      geom_longitude: '0.0'
    };

    const filter = recordNotVisitingNullIsland.create();

    test_stream([input], filter, function(err, actual) {
      t.deepEqual(actual, [], 'should have returned true');
      t.end();
    });

  });


});
