const tape = require('tape');
const event_stream = require('event-stream');
const path = require('path');
const fs = require('fs');
const temp = require('temp').track();
const proxyquire = require('proxyquire').noCallThru();

function test_stream(input, testedStream, callback, error_callback) {
    if (!error_callback) {
      error_callback = () => {};
    }

    if (!callback) {
      callback = function() {};
    }

    const input_stream = event_stream.readArray(input);
    const destination_stream = event_stream.writeArray(callback);

    input_stream
      .pipe(testedStream)
      .on('error', error_callback)
      .pipe(destination_stream);

}

tape('loadJSON tests', (test) => {
  test.test('json should be loaded from file', (t) => {
    temp.mkdir('tmp_wof_data', (err, temp_dir) => {
      fs.mkdirSync(path.join(temp_dir, 'data'));

      // write the contents to a file
      const filename = path.join(temp_dir, 'data', 'datafile.geojson');
      fs.writeFileSync(filename, '{ "a": 1, "b": 2 }\n');

      const loadJSON = require('../../src/components/loadJSON');

      const input = {
        path: path.basename(filename)
      };

      test_stream([input], loadJSON.create(temp_dir), (err, actual) => {
        temp.cleanupSync();
        t.deepEqual(actual, [{ a: 1, b: 2 }], 'should be equal');
        t.end();
      });

    });

  });

  test.test('invalid JSON should log an error and not pass along anything', (t) => {
    const logger = require('pelias-mock-logger')();

    temp.mkdir('tmp_wof_data', (err, temp_dir) => {
      fs.mkdirSync(path.join(temp_dir, 'data'));

      const loadJSON = proxyquire('../../src/components/loadJSON', {
        'pelias-logger': logger
      });

      // write the contents to a file
      const filename = path.join(temp_dir, 'data', 'datafile.geojson');
      fs.writeFileSync(filename, 'this is not json\n');

      const input = {
        id: '17',
        path: path.basename(filename)
      };

      test_stream([input], loadJSON.create(temp_dir), undefined, (err, actual) => {
        temp.cleanupSync();
        t.deepEqual(actual, undefined, 'an error should be thrown');
        t.ok(logger.isErrorMessage(`exception parsing JSON for id 17 in file ${input.path}: SyntaxError: Unexpected token h`));
        t.end();
      });

    });

  });

  test.test('missing file should be non-fatal by default', (t) => {
    const logger = require('pelias-mock-logger')();

    temp.mkdir('tmp_wof_data', (err, temp_dir) => {
      fs.mkdirSync(path.join(temp_dir, 'data'));

      const loadJSON = proxyquire('../../src/components/loadJSON', {
        'pelias-logger': logger
      });

      // non-existent file
      const input = {
        path: 'datafile.geojson'
      };

      test_stream([input], loadJSON.create(temp_dir), (err, actual) => {
        temp.cleanupSync();
        t.ok(logger.isErrorMessage(/ENOENT: no such file or directory/), 'error output present');
        t.end();
      }, (err) => {
        // because loadJSON uses parallelStream internally, the only way to test
        // that the error wasn't passed to next() is to handle in the error callback
        t.fail('error callback should not have been called since missing files are non-fatal');
      });

    });

  });

  test.test('missing file should be fatal when specified by parameter', (t) => {
    const logger = require('pelias-mock-logger')();

    temp.mkdir('tmp_wof_data', (err, temp_dir) => {
      fs.mkdirSync(path.join(temp_dir, 'data'));

      const loadJSON = proxyquire('../../src/components/loadJSON', {
        'pelias-logger': logger
      });

      // non-existent file
      const input = {
        path: 'datafile.geojson'
      };

      test_stream([input], loadJSON.create(temp_dir, true), (err, actual) => {
        t.ok(logger.isErrorMessage(/ENOENT: no such file or directory/), 'error output present');
        temp.cleanupSync();
        t.end();
      }, (err) => {
        // because loadJSON uses parallelStream internally, the only way to test
        // that the error was passed to next() is to handle in the error callback
        t.ok(err);
      });

    });

  });

});
