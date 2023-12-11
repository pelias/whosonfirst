const tape = require('tape');
const stream_mock = require('stream-mock');

const isNotNullIslandRelated = require('../../src/components/isNotNullIslandRelated');

function test_stream(input, testedStream, callback) {
  const reader = new stream_mock.ObjectReadableMock(input);
  const writer = new stream_mock.ObjectWritableMock();
  writer.on('error', (e) => callback(e));
  writer.on('finish', () => callback(null, writer.data));
  reader.pipe(testedStream).pipe(writer);
}

tape('isNotNullIslandRelated tests', (test) => {
  test.test('id=1 should return false', (t) => {
    test_stream([{ id: 1 }], isNotNullIslandRelated.create(), (err, actual) => {
      t.deepEqual(actual, [], 'should have returned false');
      t.end();
    });

  });

  test.test('id=\'1\' should return false', (t) => {
    test_stream([{ id: '1' }], isNotNullIslandRelated.create(), (err, actual) => {
      t.deepEqual(actual, [], 'should have returned false');
      t.end();
    });

  });

  test.test('id != 1 should return true', (t) => {
    test_stream([{ id: 2 }], isNotNullIslandRelated.create(), (err, actual) => {
      t.deepEqual(actual, [{ id: 2 }], 'should have returned true');
      t.end();
    });

  });

  test.test('non-postalcode placetype records should pass even if lat/lon is 0/0', (t) => {
    const input = {
      placetype: 'non-postalcode',
      geom_latitude: '0.0',
      geom_longitude: '0.0'
    };

    test_stream([input], isNotNullIslandRelated.create(), (err, actual) => {
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

    test_stream([input], isNotNullIslandRelated.create(), (err, actual) => {
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

    test_stream([input], isNotNullIslandRelated.create(), (err, actual) => {
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

    test_stream([input], isNotNullIslandRelated.create(), (err, actual) => {
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

    test_stream([input], isNotNullIslandRelated.create(), (err, actual) => {
      t.deepEqual(actual, [], 'should have returned true');
      t.end();
    });

  });

  test.test('postalcode placetype records should not pass if lat/lon is 0/0 (number)', (t) => {
    const input = {
      placetype: 'postalcode',
      geom_latitude: 0,
      geom_longitude: 0
    };

    test_stream([input], isNotNullIslandRelated.create(), (err, actual) => {
      t.deepEqual(actual, [], 'should have returned true');
      t.end();
    });
  });

  test.test('postalcode placetype records should not pass if lat/lon is 0/0 (string)', (t) => {
    const input = {
      placetype: 'postalcode',
      geom_latitude: '0.0',
      geom_longitude: '0.0'
    };

    test_stream([input], isNotNullIslandRelated.create(), (err, actual) => {
      t.deepEqual(actual, [], 'should have returned true');
      t.end();
    });
  });
  test.end();
});
