const tape = require('tape');
const Readable = require('stream').Readable;
const through2 = require('through2');
const EOL = require('os').EOL;

const parseMetaFiles = require('../../src/components/parseMetaFiles');

tape('parseMetaFiles tests', (test) => {
  test.test('first row should be column names with " for escape/enclosing', (t) => {
    const s = new Readable();
    s.push(`id,name${EOL}`);
    s.push(`1,name1${EOL}`);
    s.push(`2,name","2${EOL}`);
    s.push(`3,"name,3"${EOL}`);
    s.push(null);

    const expected = [
      { id: '1', name: 'name1'},
      { id: '2', name: 'name,2'},
      { id: '3', name: 'name,3'}
    ];

    s.pipe(parseMetaFiles.create()).pipe(through2.obj(function(record, enc, next) {
      t.deepEquals(record, expected.shift());
      next();
    })).on('finish', () => {
      t.end();
    });

  });
  test.end();

});
