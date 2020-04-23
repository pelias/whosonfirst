const tape = require('tape');

const wof_module = require('../');

tape('test the exports of whosonfirst module', function(test) {
  test.equals(typeof wof_module, 'object');
  test.end();
});
