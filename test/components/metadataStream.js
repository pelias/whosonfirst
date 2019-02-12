
const tape = require('tape');
const fs = require('fs');
const path = require('path');
const temp = require('temp').track();
const through2 = require('through2');

tape('metadataStream tests', (test) => {
  test.test('should read all data', (t) => {
    temp.mkdir('tmp_wof_root', (err, temp_dir) => {
      fs.mkdirSync(path.join(temp_dir, 'meta'));

      // write some data to a file that will be read
      fs.writeFileSync(
        path.join(temp_dir, 'meta', 'whosonfirst-data-my_placetype-latest.csv'),
        'some metadata');

      const metadataStream = require('../../src/components/metadataStream')(temp_dir);
      const stream = metadataStream.create('my_placetype');

      let contents = '';

      stream.pipe(through2.obj(function(data, enc, next) {
        contents += data;
        next();

      })).on('finish', () => {
        temp.cleanup((err, stats) => {
          t.notOk(err);
          t.deepEqual(contents, 'some metadata', 'should be equal');
          t.end();
        });

      });

    });

  });
  test.end();

});
