const tape = require('tape');
const stream_mock = require('stream-mock');

const conformsTo = require('../../src/components/conformsTo');

function test_stream(input, testedStream, callback) {
  const reader = new stream_mock.ObjectReadableMock(input);
  const writer = new stream_mock.ObjectWritableMock();
  writer.on('error', (e) => callback(e));
  writer.on('finish', () => callback(null, writer.data));
  reader.pipe(testedStream).pipe(writer);
}

tape('conformsTo', (test) => {
  test.test('undefined object should return false', (t) => {
    const model = {
      key: (val) => {
        return val > 0;
      }
    };

    test_stream([undefined], conformsTo.create(model), (err, actual) => {
      t.deepEqual(actual, [], 'should have returned false');
      t.end();
    });

  });

  test.test('object not conforming to model should return false', (t) => {
    const input = {
      key: 0
    };

    const model = {
      key: (val) => {
        return val > 0;
      }
    };

    test_stream([input], conformsTo.create(model), (err, actual) => {
      t.deepEqual(actual, [], 'should have returned false');
      t.end();
    });

  });

  test.test('undefined model should return true', (t) => {
    const input = {
      key: 0
    };

    test_stream([input], conformsTo.create(undefined), (err, actual) => {
      t.deepEqual(actual, [input], 'should have returned true');
      t.end();
    });

  });

  test.test('object conforming to model should return true', (t) => {
    const input = {
      key: 0
    };

    const model = {
      key: (val) => {
        return val >= 0;
      }
    };

    test_stream([input], conformsTo.create(model), (err, actual) => {
      t.deepEqual(actual, [input], 'should have returned true');
      t.end();
    });

  });
  test.end();

});
